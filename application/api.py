from flask import Blueprint, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from application.models import db, User, Department, DoctorProfile, PatientProfile, Appointment, Availability, Treatment
from application.extensions import cache

api_bp = Blueprint('api', __name__)

@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400
        
    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role='Patient'
    )
    db.session.add(new_user)
    db.session.commit()
    
    # start with a clean patient profile
    patient = PatientProfile(user_id=new_user.id)
    if 'contact_number' in data:
        patient.contact_number = data['contact_number']
        
    db.session.add(patient)
    db.session.commit()
    cache.delete('admin_stats')
    return jsonify({"message": "User created successfully"}), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401
    
    if not user.active:
        return jsonify({"message": "Account deactivated"}), 403
        
    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={'role': user.role, 'username': user.username}
    )
    return jsonify({"access_token": access_token, "role": user.role}), 200

# endpoints for the admin controls
@api_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, key_prefix='admin_stats')
def admin_dashboard():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Admin':
        return jsonify({"message": "Unauthorized"}), 403
        
    doctors_count = DoctorProfile.query.count()
    patients_count = PatientProfile.query.join(User).filter(User.active == True).count()
    appointments_count = Appointment.query.count()
    
    recent = Appointment.query.order_by(Appointment.date.desc(), Appointment.start_time.desc()).limit(8).all()
    recent_data = []
    for a in recent:
        recent_data.append({
            "id": a.id,
            "patient": a.patient.user.username,
            "doctor": a.doctor.user.username,
            "specialization": a.doctor.specialization,
            "date": a.date.strftime('%Y-%m-%d'),
            "time": a.start_time.strftime('%H:%M'),
            "status": a.status
        })
    
    return jsonify({
        "total_doctors": doctors_count,
        "total_patients": patients_count,
        "total_appointments": appointments_count,
        "recent_appointments": recent_data
    }), 200

@api_bp.route('/admin/doctors', methods=['GET', 'POST'])
@jwt_required()
def admin_doctors():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Admin':
        return jsonify({"message": "Unauthorized"}), 403
        
    if request.method == 'GET':
        search_q = request.args.get('q', '').strip()
        db_query = DoctorProfile.query.join(User)
        if search_q:
            db_query = db_query.filter(
                (User.username.ilike(f'%{search_q}%')) | 
                (DoctorProfile.specialization.ilike(f'%{search_q}%'))
            )
        doctors = db_query.all()
        res = []
        for doc in doctors:
            res.append({
                "id": doc.id,
                "name": doc.user.username,
                "email": doc.user.email,
                "specialization": doc.specialization,
                "department": doc.department.name if doc.department else "",
                "active": doc.user.active
            })
        return jsonify(res), 200
        
    elif request.method == 'POST':
        data = request.get_json()
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role='Doctor'
        )
        db.session.add(new_user)
        db.session.commit()
        
        doc = DoctorProfile(
            user_id=new_user.id,
            department_id=data['department_id'],
            specialization=data['specialization'],
            experience_years=data.get('experience_years', 0)
        )
        db.session.add(doc)
        db.session.commit()
        cache.delete('doctors_list_all')
        cache.delete('admin_stats')
        return jsonify({"message": "Doctor added successfully"}), 201

@api_bp.route('/admin/doctors/<int:id>', methods=['DELETE'])
@jwt_required()
def admin_remove_doctor(id):
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    doc = DoctorProfile.query.get(id)
    if doc:
        doc.user.active = False
        db.session.commit()
        cache.delete('admin_stats')
        return jsonify({"message": "Doctor deactivated"}), 200
    return jsonify({"message": "Not found"}), 404

@api_bp.route('/admin/doctors/<int:id>', methods=['PUT'])
@jwt_required()
def admin_edit_doctor(id):
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    doc = DoctorProfile.query.get(id)
    if not doc: return jsonify({"message": "Not found"}), 404
        
    data = request.get_json()
    if 'username' in data:
        # Check if username is taken by anyone ELSE
        from application.models import User
        existing = User.query.filter(User.username == data['username'], User.id != doc.user.id).first()
        if existing: return jsonify({"message": "Username already taken"}), 400
        doc.user.username = data['username']
        
    if 'specialization' in data: doc.specialization = data['specialization']
    if 'department_id' in data: doc.department_id = data['department_id']
    if 'experience_years' in data: doc.experience_years = data['experience_years']
    if 'email' in data: doc.user.email = data['email']
    if 'active' in data: doc.user.active = data['active']
    
    db.session.commit()
    cache.delete('admin_stats')
    return jsonify({"message": "Doctor updated"}), 200

@api_bp.route('/admin/patients', methods=['GET'])
@jwt_required()
def admin_patients():
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    search_q = request.args.get('q', '').strip()
    from sqlalchemy import or_
    db_query = PatientProfile.query.join(User)
    
    if search_q:
        filters = [
            User.username.ilike(f'%{search_q}%'),
            PatientProfile.contact_number.ilike(f'%{search_q}%'),
            User.email.ilike(f'%{search_q}%')
        ]
        if search_q.isdigit():
            filters.append(PatientProfile.id == int(search_q))
        db_query = db_query.filter(or_(*filters))
        
    patients = db_query.all()
    res = []
    for pat in patients:
        res.append({
            "id": pat.id,
            "name": pat.user.username,
            "email": pat.user.email,
            "dob": pat.dob.strftime('%Y-%m-%d') if pat.dob else None,
            "contact_number": pat.contact_number,
            "blood_group": pat.blood_group,
            "active": pat.user.active
        })
    return jsonify(res), 200

@api_bp.route('/admin/patients/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def admin_manage_patient(id):
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    pat = PatientProfile.query.get(id)
    if not pat: return jsonify({"message": "Not found"}), 404
        
    if request.method == 'DELETE':
        pat.user.active = False
        db.session.commit()
        return jsonify({"message": "Patient deactivated"}), 200
        
    data = request.get_json()
    if 'email' in data: 
        existing = User.query.filter(User.email == data['email'], User.id != pat.user.id).first()
        if existing: return jsonify({"message": "Email already in use"}), 400
        pat.user.email = data['email']
        
    if 'contact_number' in data: 
        contact = data['contact_number']
        if len(contact) != 10 or not contact.isdigit():
            return jsonify({"message": "Contact number must be exactly 10 digits"}), 400
        pat.contact_number = contact
    if 'active' in data: pat.user.active = data['active']
    if 'blood_group' in data: pat.blood_group = data['blood_group']
    
    from datetime import datetime
    if 'dob' in data and data['dob']:
        try:
            pat.dob = datetime.strptime(data['dob'], '%Y-%m-%d').date()
        except: pass
    
    db.session.commit()
    cache.delete('admin_stats')
    return jsonify({"message": "Patient updated"}), 200

@api_bp.route('/admin/appointments', methods=['GET'])
@jwt_required()
def admin_appointments():
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    appointments = Appointment.query.all()
    res = []
    for appt in appointments:
        res.append({
            "id": appt.id,
            "date": appt.date.strftime('%Y-%m-%d'),
            "start_time": appt.start_time.strftime('%H:%M:%S'),
            "patient_name": appt.patient.user.username,
            "doctor_name": appt.doctor.user.username,
            "status": appt.status
        })
    return jsonify(res), 200

@api_bp.route('/departments', methods=['GET'])
@cache.cached(timeout=300, key_prefix='departments_list')
def get_departments():
    deps = Department.query.all()
    res = [{"id": d.id, "name": d.name, "description": d.description} for d in deps]
    return jsonify(res), 200

@api_bp.route('/admin/departments', methods=['POST'])
@jwt_required()
def admin_add_department():
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json()
    dept = Department(
        name=data['name'],
        description=data.get('description', '')
    )
    db.session.add(dept)
    db.session.commit()
    
    cache.delete('departments_list')
    cache.delete('admin_stats')
        
    return jsonify({"message": "Department added"}), 201

@api_bp.route('/admin/departments/<int:id>', methods=['DELETE'])
@jwt_required()
def admin_delete_department(id):
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    dept = Department.query.get(id)
    if not dept: return jsonify({"message": "Not found"}), 404
    
    db.session.delete(dept)
    db.session.commit()
    
    cache.delete('departments_list')
    cache.delete('admin_stats')
        
    return jsonify({"message": "Department deleted"}), 200

@api_bp.route('/departments/<int:dept_id>', methods=['GET'])
@cache.cached(timeout=60)
def get_department_detail(dept_id):
    dept = Department.query.get_or_404(dept_id)
    from sqlalchemy.orm import joinedload
    doctors = DoctorProfile.query.options(
        joinedload(DoctorProfile.user)
    ).filter_by(department_id=dept_id).all()
    return jsonify({
        "id": dept.id,
        "name": dept.name,
        "description": dept.description or "",
        "doctors": [{"id": d.id, "name": d.user.username, "specialization": d.specialization} for d in doctors]
    }), 200

@api_bp.route('/doctors/<int:doc_id>', methods=['GET'])
def get_doctor_detail(doc_id):
    from sqlalchemy.orm import joinedload, selectinload
    from datetime import datetime
    now = datetime.now()
    doc = DoctorProfile.query.options(
        joinedload(DoctorProfile.user),
        joinedload(DoctorProfile.department),
        selectinload(DoctorProfile.availability)
    ).get_or_404(doc_id)
    avails = [
        {"date": a.date.strftime('%Y-%m-%d'), "start_time": a.start_time.strftime('%H:%M:%S'), "end_time": a.end_time.strftime('%H:%M:%S')}
        for a in doc.availability 
        if not a.is_booked and datetime.combine(a.date, a.start_time) > now
    ]
    return jsonify({
        "id": doc.id,
        "name": doc.user.username,
        "specialization": doc.specialization,
        "department": doc.department.name if doc.department else "",
        "department_id": doc.department_id,
        "bio": doc.bio if hasattr(doc, 'bio') and doc.bio else "",
        "availability": avails
    }), 200

# doctor dashboard and profile logic
@api_bp.route('/doctor/dashboard', methods=['GET'])
@jwt_required()
def doctor_dashboard():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    doc = DoctorProfile.query.filter_by(user_id=int(identity)).first()
    if not doc: return jsonify({"message": "Profile not found"}), 404
    
    from datetime import date
    today = date.today()
    # upcoming meetings for the doctor
    appointments = Appointment.query.filter_by(doctor_id=doc.id).filter(Appointment.date >= today).order_by(Appointment.date.asc(), Appointment.start_time.asc()).all()
    
    res = []
    for appt in appointments:
        t = appt.treatment
        res.append({
            "id": appt.id,
            "patient_id": appt.patient.id,
            "patient_name": appt.patient.user.username,
            "date": appt.date.strftime('%Y-%m-%d'),
            "start_time": appt.start_time.strftime('%H:%M:%S'),
            "status": appt.status,
            "treatment": {
                "visit_type": t.visit_type if t else "In-person",
                "tests_done": t.tests_done if t else "",
                "diagnosis": t.diagnosis if t else "",
                "prescription": t.prescription if t else "",
                "medicines": t.medicines if t else ""
            } if t else None
        })
    return jsonify(res), 200

@api_bp.route('/doctor/appointment/<int:id>/status', methods=['PUT'])
@jwt_required()
def doctor_update_appointment(id):
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    appt = Appointment.query.get(id)
    if not appt: return jsonify({"message": "Not found"}), 404
    
    data = request.get_json()
    appt.status = data.get('status') # 'Completed', 'Cancelled'
    db.session.commit()
    return jsonify({"message": "Status updated"}), 200

@api_bp.route('/doctor/treatment', methods=['POST'])
@jwt_required()
def doctor_add_treatment():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json()
    
    # update if we already started the notes, otherwise start new
    treatment = Treatment.query.filter_by(appointment_id=data['appointment_id']).first()
    if not treatment:
        treatment = Treatment(appointment_id=data['appointment_id'])
        db.session.add(treatment)
        
    appt = Appointment.query.get(data['appointment_id'])
    if appt:
        appt.status = 'Completed'
        
    treatment.diagnosis = data.get('diagnosis', '')
    treatment.prescription = data.get('prescription', '')
    treatment.notes = data.get('notes', '')
    treatment.visit_type = data.get('visit_type', '')
    treatment.tests_done = data.get('tests_done', '')
    treatment.medicines = data.get('medicines', '')
    
    # Also update appointment status
    appt = Appointment.query.get(data['appointment_id'])
    if appt:
        appt.status = 'Completed'
        
    db.session.commit()
    return jsonify({"message": "Treatment saved"}), 200

@api_bp.route('/doctor/patients', methods=['GET'])
@jwt_required()
def doctor_patients():
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    doc = DoctorProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    appts = Appointment.query.filter_by(doctor_id=doc.id).all()
    unique_patients = {a.patient.id: a.patient for a in appts}
    
    res = [{"id": p.id, "name": p.user.username} for p in unique_patients.values()]
    return jsonify(res), 200

@api_bp.route('/doctor/patient/<int:id>/history', methods=['GET'])
@jwt_required()
def doctor_patient_history(id):
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    appts = Appointment.query.filter_by(patient_id=id).all() # seeing everything for this patient
    res = []
    for appt in appts:
        t = appt.treatment
        if t:
            res.append({
                "visit_no": appt.id,
                "visit_type": t.visit_type or "In-person",
                "tests_done": t.tests_done or "",
                "diagnosis": t.diagnosis or "",
                "prescription": t.prescription or "",
                "medicines": t.medicines or "",
                "doctor_name": appt.doctor.user.username,
                "department_name": appt.doctor.department.name if appt.doctor.department else ""
            }) 
    return jsonify(res), 200

@api_bp.route('/admin/patient/<int:id>/history', methods=['GET'])
@jwt_required()
def admin_patient_history(id):
    claims = get_jwt()
    if claims['role'] != 'Admin': return jsonify({"message": "Unauthorized"}), 403
    
    appts = Appointment.query.filter_by(patient_id=id).all()
    res = []
    for appt in appts:
        t = appt.treatment
        res.append({
            "id": appt.id,
            "date": appt.date.strftime('%Y-%m-%d'),
            "doctor": appt.doctor.user.username,
            "department": appt.doctor.department.name if appt.doctor.department else "N/A",
            "status": appt.status,
            "diagnosis": t.diagnosis if t else "No record",
            "prescription": t.prescription if t else "No record",
            "visit_type": t.visit_type if t else "N/A",
            "medicines": t.medicines if t else "",
            "tests_done": t.tests_done if t else ""
        })
    return jsonify(res), 200

@api_bp.route('/doctor/availability', methods=['GET', 'POST'])
@jwt_required()
def doctor_availability():
    claims = get_jwt()
    if claims['role'] != 'Doctor': return jsonify({"message": "Unauthorized"}), 403
    
    doc = DoctorProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    from datetime import date, datetime
    today = date.today()
    
    if request.method == 'GET':
        availabilities = Availability.query.filter_by(doctor_id=doc.id).filter(Availability.date >= today).all()
        res = [{"id": a.id, "date": a.date.strftime('%Y-%m-%d'), "start_time": a.start_time.strftime('%H:%M:%S'), "end_time": a.end_time.strftime('%H:%M:%S')} for a in availabilities]
        return jsonify(res), 200
        
    elif request.method == 'POST':
        data = request.get_json()
        Availability.query.filter_by(doctor_id=doc.id).filter(Availability.date >= today).delete()
        
        from datetime import time
        for item in data:
            d_obj = datetime.strptime(item['date'], '%Y-%m-%d').date()
            
            # Morning: 9 AM to 12 PM (30 min slots)
            if 'morning' in item['slots']:
                for hr in range(8, 12):
                    for mn in [0, 30]:
                        s_time = time(hr, mn)
                        e_hr = hr if mn == 0 else hr + 1
                        e_mn = 30 if mn == 0 else 0
                        e_time = time(e_hr, e_mn)
                        a = Availability(doctor_id=doc.id, date=d_obj, start_time=s_time, end_time=e_time)
                        db.session.add(a)

            # Evening: 4 PM to 9 PM (30 min slots)
            if 'evening' in item['slots']:
                for hr in range(16, 21): # 4 PM to 9 PM
                    for mn in [0, 30]:
                        s_time = time(hr, mn)
                        e_hr = hr if mn == 0 else hr + 1
                        e_mn = 30 if mn == 0 else 0
                        e_time = time(e_hr, e_mn)
                        a = Availability(doctor_id=doc.id, date=d_obj, start_time=s_time, end_time=e_time)
                        db.session.add(a)
        
        db.session.commit()
        cache.delete('doctors_list_all')
        return jsonify({"message": "Availability updated"}), 200

# patient portal endpoints
@api_bp.route('/doctors', methods=['GET'])
def get_doctors():
    search_q = request.args.get('q', '').strip()
    
    # Only use cache for default (no search) view
    if not search_q:
        cached = cache.get('doctors_list_all')
        if cached: return jsonify(cached), 200

    from datetime import date
    from sqlalchemy.orm import joinedload, selectinload
    today = date.today()
    
    # Query with Search
    db_query = DoctorProfile.query.join(User)
    if search_q:
        db_query = db_query.filter(
            (User.username.ilike(f'%{search_q}%')) | 
            (DoctorProfile.specialization.ilike(f'%{search_q}%'))
        )
        
    docs = db_query.options(
        joinedload(DoctorProfile.user),
        joinedload(DoctorProfile.department),
        selectinload(DoctorProfile.availability)
    ).all()
    
    from datetime import datetime
    now = datetime.now()
    res = []
    for d in docs:
        avails = [
            {"date": a.date.strftime('%Y-%m-%d'), "start_time": a.start_time.strftime('%H:%M:%S'), "end_time": a.end_time.strftime('%H:%M:%S')}
            for a in d.availability 
            if not a.is_booked and datetime.combine(a.date, a.start_time) > now
        ]
        res.append({
            "id": d.id, 
            "name": d.user.username, 
            "specialization": d.specialization, 
            "department": d.department.name if d.department else "",
            "availability": avails
        })
        
    # Cache the full list if no search was performed
    if not search_q:
        cache.set('doctors_list_all', res, timeout=300)
        
    return jsonify(res), 200

@api_bp.route('/patient/appointment', methods=['POST'])
@jwt_required()
def patient_book_appointment():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Patient': return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json()
    patient = PatientProfile.query.filter_by(user_id=int(identity)).first()
    if not patient: return jsonify({"message": "Patient profile not found"}), 404
    
    from datetime import datetime
    try:
        date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
        # Handle both %H:%M and %H:%M:%S formats
        st = data['start_time']
        et = data['end_time']
        start_time_obj = datetime.strptime(st, '%H:%M:%S' if len(st) > 5 else '%H:%M').time()
        end_time_obj = datetime.strptime(et, '%H:%M:%S' if len(et) > 5 else '%H:%M').time()
    except Exception as e:
        return jsonify({"message": f"Invalid date/time format: {e}"}), 400
    
    # check if the doctor is booked then
    doctor_busy = Appointment.query.filter_by(
        doctor_id=data['doctor_id'],
        date=date_obj,
        start_time=start_time_obj,
    ).filter(Appointment.status != 'Cancelled').first()
    
    if doctor_busy:
        return jsonify({"message": "This doctor is already booked for this slot."}), 400
        
    # check if the patient has another meeting at same time
    patient_busy = Appointment.query.filter_by(
        patient_id=patient.id,
        date=date_obj,
        start_time=start_time_obj
    ).filter(Appointment.status != 'Cancelled').first()
    
    if patient_busy:
        return jsonify({"message": "You already have an appointment at this time."}), 400
    
    # create the record
    appt = Appointment(
        patient_id=patient.id,
        doctor_id=data['doctor_id'],
        date=date_obj,
        start_time=start_time_obj,
        end_time=end_time_obj,
        status='Booked'
    )
    db.session.add(appt)
    
    # lock the slot
    avail = Availability.query.filter_by(
        doctor_id=data['doctor_id'],
        date=date_obj,
        start_time=start_time_obj
    ).first()
    if avail:
        avail.is_booked = True
        
    db.session.commit()
    cache.delete('admin_stats')
    return jsonify({"message": "Appointment booked successfully!"}), 201

@api_bp.route('/patient/history', methods=['GET'])
@jwt_required()
def patient_history():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Patient': return jsonify({"message": "Unauthorized"}), 403
    
    patient = PatientProfile.query.filter_by(user_id=int(identity)).first()
    appts = Appointment.query.filter_by(patient_id=patient.id).all()
    
    res = []
    for appt in appts:
        t = appt.treatment
        res.append({
            "id": appt.id,
            "doctor": appt.doctor.user.username,
            "doctor_id": appt.doctor_id,
            "department": appt.doctor.department.name if appt.doctor.department else "",
            "date": appt.date.strftime('%Y-%m-%d'),
            "start_time": appt.start_time.strftime('%H:%M:%S'),
            "end_time": appt.end_time.strftime('%H:%M:%S'),
            "status": appt.status,
            "diagnosis": t.diagnosis if t else "",
            "prescription": t.prescription if t else "",
            "visit_type": t.visit_type if t else "In-person",
            "tests_done": t.tests_done if t else "",
            "medicines": t.medicines if t else "",
            "next_visit_date": t.next_visit_date.strftime('%Y-%m-%d') if (t and t.next_visit_date) else ""
        })
    return jsonify(res), 200

@api_bp.route('/shared/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def shared_patient_history(patient_id):
    claims = get_jwt()
    if claims['role'] not in ['Admin', 'Doctor']:
        return jsonify({"message": "Unauthorized"}), 403
    
    appts = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.date.desc()).all()
    res = []
    for appt in appts:
        t = appt.treatment
        res.append({
            "id": appt.id,
            "doctor": appt.doctor.user.username,
            "department": appt.doctor.department.name if appt.doctor.department else "",
            "date": appt.date.strftime('%Y-%m-%d'),
            "status": appt.status,
            "diagnosis": t.diagnosis if t else "",
            "prescription": t.prescription if t else "",
            "visit_type": t.visit_type if t else "In-person",
            "medicines": t.medicines if t else "",
            "tests_done": t.tests_done if t else ""
        })
    return jsonify(res), 200

@api_bp.route('/patient/appointment/<int:id>/cancel', methods=['PUT'])
@jwt_required()
def patient_cancel_appointment(id):
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Patient': return jsonify({"message": "Unauthorized"}), 403
    
    patient = PatientProfile.query.filter_by(user_id=int(identity)).first()
    appt = Appointment.query.filter_by(id=id, patient_id=patient.id).first()
    if not appt: return jsonify({"message": "Not found"}), 404
    
    appt.status = 'Cancelled'
    
    # release the slot back
    avail = Availability.query.filter_by(
        doctor_id=appt.doctor_id,
        date=appt.date,
        start_time=appt.start_time
    ).first()
    if avail:
        avail.is_booked = False
        
    db.session.commit()
    cache.delete('admin_stats')
    return jsonify({"message": "Appointment cancelled"}), 200

@api_bp.route('/patient/appointment/<int:id>/reschedule', methods=['PUT'])
@jwt_required()
def patient_reschedule_appointment(id):
    identity = get_jwt_identity()
    patient = PatientProfile.query.filter_by(user_id=int(identity)).first()
    appt = Appointment.query.filter_by(id=id, patient_id=patient.id).first()
    
    if not appt or appt.status != 'Booked':
        return jsonify({"message": "Appointment cannot be rescheduled"}), 400
        
    data = request.get_json()
    from datetime import datetime
    try:
        new_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        st = data['start_time']
        et = data['end_time']
        new_start = datetime.strptime(st, '%H:%M:%S' if len(st) > 5 else '%H:%M').time()
        new_end = datetime.strptime(et, '%H:%M:%S' if len(et) > 5 else '%H:%M').time()
    except Exception as e:
        return jsonify({"message": f"Format error: {e}"}), 400

    # check doctor availability
    doctor_busy = Appointment.query.filter_by(
        doctor_id=appt.doctor_id,
        date=new_date,
        start_time=new_start
    ).filter(Appointment.id != id, Appointment.status != 'Cancelled').first()
    
    if doctor_busy:
        return jsonify({"message": "Doctor is not available at this time"}), 400

    # release old slot
    old_avail = Availability.query.filter_by(
        doctor_id=appt.doctor_id,
        date=appt.date,
        start_time=appt.start_time
    ).first()
    if old_avail: old_avail.is_booked = False
    
    # update appointment
    appt.date = new_date
    appt.start_time = new_start
    appt.end_time = new_end
    
    # lock new slot
    new_avail = Availability.query.filter_by(
        doctor_id=appt.doctor_id,
        date=new_date,
        start_time=new_start
    ).first()
    if new_avail: new_avail.is_booked = True
    
    db.session.commit()
    return jsonify({"message": "Appointment rescheduled successfully"}), 200

@api_bp.route('/patient/profile', methods=['GET', 'PUT'])
@jwt_required()
def patient_profile():
    identity = get_jwt_identity()
    claims = get_jwt()
    if claims['role'] != 'Patient': return jsonify({"message": "Unauthorized"}), 403
    
    patient = PatientProfile.query.filter_by(user_id=int(identity)).first()
    
    if request.method == 'GET':
        return jsonify({
            "username": patient.user.username,
            "email": patient.user.email,
            "contact_number": patient.contact_number,
            "dob": patient.dob.strftime('%Y-%m-%d') if patient.dob else "",
            "blood_group": patient.blood_group or ""
        }), 200
        
    elif request.method == 'PUT':
        data = request.get_json()
        new_email = data.get('email')
        
        if new_email and new_email != patient.user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({"message": "Email already in use"}), 400
            patient.user.email = new_email
            
        patient.contact_number = data.get('contact_number', patient.contact_number)
        from datetime import datetime
        if data.get('dob'):
            patient.dob = datetime.strptime(data['dob'], '%Y-%m-%d').date()
        patient.blood_group = data.get('blood_group', patient.blood_group)
        db.session.commit()
        return jsonify({"message": "Profile updated"}), 200


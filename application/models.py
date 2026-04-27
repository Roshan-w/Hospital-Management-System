from application.extensions import db
from datetime import datetime

# basic login details for everyone
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # Admin, Doctor, Patient
    active = db.Column(db.Boolean, default=True)

# medical departments like cardiology etc
class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    doctors = db.relationship('DoctorProfile', backref='department', lazy=True)

# extra info for doctors only
class DoctorProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    specialization = db.Column(db.String(100))
    experience_years = db.Column(db.Integer, default=0)
    user = db.relationship('User', backref=db.backref('doctor_profile', uselist=False))
    availability = db.relationship('Availability', backref='doctor', lazy=True, cascade="all, delete")

#patient specific info
class PatientProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dob = db.Column(db.Date)
    contact_number = db.Column(db.String(20))
    blood_group = db.Column(db.String(10))
    user = db.relationship('User', backref=db.backref('patient_profile', uselist=False))
    appointments = db.relationship('Appointment', backref='patient', lazy=True, cascade="all, delete")

# when the doctor is free for work
class Availability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profile.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_booked = db.Column(db.Boolean, default=False)

# booking details for a visit
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient_profile.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profile.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='Booked') # Booked, Completed, Cancelled
    doctor = db.relationship('DoctorProfile', backref='appointments', lazy=True)
    treatment = db.relationship('Treatment', backref='appointment', uselist=False, cascade="all, delete")

#what happened during the checkup
class Treatment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'), nullable=False)
    diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    notes = db.Column(db.Text)
    visit_type = db.Column(db.String(50))
    tests_done = db.Column(db.String(255))
    medicines = db.Column(db.Text)
    next_visit_date = db.Column(db.Date, nullable=True)

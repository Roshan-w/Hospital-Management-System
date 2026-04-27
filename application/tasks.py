from celery import shared_task
from application.models import db, Appointment, DoctorProfile, Treatment, PatientProfile
from application.extensions import mail
from flask_mail import Message
from datetime import date
import csv
import os

@shared_task
def daily_reminders():
    today = date.today()
    appts = Appointment.query.filter_by(date=today, status='Booked').all()
    count = 0
    for appt in appts:
        patient = appt.patient
        subject = "Appointment Reminder - HMS"
        body = f"Hi {patient.user.username},\n\nThis is a reminder for your appointment today at {appt.start_time.strftime('%H:%M')} with Dr. {appt.doctor.user.username}.\n\nLocation: {appt.doctor.department.name} Department.\n\nPlease arrive 10 minutes early."
        
        msg = Message(subject, recipients=[patient.user.email], body=body)
        try:
            mail.send(msg)
            count += 1
        except Exception as e:
            print(f"Failed to send mail to {patient.user.email}: {e}")
        
    return f"Sent {count} email reminders."

@shared_task
def monthly_activity_report():
    # Send a report to each patient about their visits this month
    patients = PatientProfile.query.all()
    count = 0
    for pat in patients:
        appts = Appointment.query.filter_by(patient_id=pat.id, status='Completed').all()
        if not appts: continue
        
        subject = "Your Monthly Health Activity Report"
        html_body = f"<h3>Monthly Summary for {pat.user.username}</h3>"
        html_body += f"<p>You had {len(appts)} completed visits this month.</p><ul>"
        for a in appts:
            html_body += f"<li>{a.date}: Dr. {a.doctor.user.username} - {a.treatment.diagnosis if a.treatment else 'Routine'}</li>"
        html_body += "</ul>"
        
        msg = Message(subject, recipients=[pat.user.email], html=html_body)
        try:
            mail.send(msg)
            count += 1
        except Exception as e:
            print(f"Failed to send monthly report to {pat.user.email}: {e}")
            
    return f"Sent {count} monthly reports."

    return f"Sent {count} monthly reports."

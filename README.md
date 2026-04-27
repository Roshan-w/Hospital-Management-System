# HMS V2.0 - Modern Hospital Management System

A modernized Hospital Management System built with a powerful Flask backend, real-time background processing via Celery, and a premium Vue.js frontend dashboard.

##  Core Features

### Multi-Role Access Control
*   **Admin Dashboard**: Manage the hospital registry (Doctors/Patients), monitor hospital-wide stats, and manage clinical units.
*   **Doctor Portal**: Manage availability slots, view scheduled patients, and record clinical assessmets (Diagnosis/Prescription).
*   **Patient Portal**: Book appointments with real-time slot validation, manage personal health profiles, and download medical records.

### Clinical Excellence
*   **Smart Booking**: Automated slot management that hides past timings and prevents double-booking.
*   **Health Records**: Structured treatment documentation including "Suggest Next Visit" metadata.
*   **CSV Exports**: One-click medical history export for patients.

### Automation & Notifications
*   **Daily Reminders**: Automated Celery task that sends email notifications to patients for today's appointments.
*   **Auto-Init**: Zero-config database setup—automatic seeding of Admin and Departments on launch.

## Technology Stack

*   **Backend**: Python (Flask)
*   **Database**: SQLAlchemy (SQLite)
*   **Auth**: JWT (JSON Web Tokens)
*   **Background Jobs**: Celery & Redis
*   **Email**: Flask-Mail
*   **Frontend**: Vue.js 3
*   **Styling**: Bootstrap 5

## Quick Start

### 1. Requirements
Ensure the system has **Redis** installed and running on the system for task queuing.

### 2. Setup Task Stack
Install dependencies from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 3. Launch the Application
Start the Flask server:
```bash
python app.py
```


### 4. Start Background Processes
In separate terminal windows:
```bash
# Start Celery Worker
celery -A app.celery worker --loglevel=info --pool=solo

# Start Celery Beat (Scheduler)
celery -A app.celery beat --loglevel=info
```

### 5. Development Mail Server
To catch outgoing emails locally (Development only):
```bash
pip install aiosmtpd
python -m aiosmtpd -n -l localhost:1025
```

##  Default Credentials
*   **Admin**: `admin` / `admin123`
*   **Patient/Doctor**: Created through the respectively portals once Admin is logged in.

---


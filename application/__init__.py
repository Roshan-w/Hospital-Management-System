from flask import Flask
from flask_cors import CORS
from application.extensions import db, jwt, cache
from celery import Celery

def make_celery(app):
    celery = Celery(app.import_name)
    celery.conf.update(
        broker_url=app.config.get('broker_url'),
        result_backend=app.config.get('result_backend'),
        beat_schedule=app.config.get('beat_schedule'),
        timezone='Asia/Kolkata',
        include=['application.tasks']
    )
    
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
                
    celery.Task = ContextTask
    return celery

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    CORS(app)
    
    app.config['SECRET_KEY'] = 'a-super-long-and-very-hard-to-guess-secret-key-for-hms-v2-123456789'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../hms.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'jwt-secure-secret-key-longer-than-32-chars-for-hmac-sha256'
    
    # using simple memory cache so we don't need redis for everything
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    
    app.config['broker_url'] = 'redis://localhost:6379/2'
    app.config['result_backend'] = 'redis://localhost:6379/3'
    
    from celery.schedules import crontab
    app.config['beat_schedule'] = {
        'daily-reminders': {
            'task': 'application.tasks.daily_reminders',
            'schedule': crontab(hour=8, minute=0), # 8am daily
        },
        'monthly-report': {
            'task': 'application.tasks.monthly_activity_report',
            'schedule': crontab(day_of_month=1, hour=0, minute=0),
        }
    }
    
    app.config['MAIL_SERVER'] = 'localhost'
    app.config['MAIL_PORT'] = 1025
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USERNAME'] = None
    app.config['MAIL_PASSWORD'] = None
    app.config['MAIL_DEFAULT_SENDER'] = 'no-reply@hms.com'
    
    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    from application.extensions import mail
    mail.init_app(app)
    
    celery = make_celery(app)
    app.celery = celery
    
    from application.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Auto-initialize database on startup
    with app.app_context():
        db.create_all()
        from application.models import User, Department
        from werkzeug.security import generate_password_hash
        
        # Admin
        if not User.query.filter_by(role='Admin').first():
            print("Auto-creating Admin account...")
            admin = User(
                username='admin',
                email='admin@hms.com',
                password_hash=generate_password_hash('admin123'),
                role='Admin',
                active=True
            )
            db.session.add(admin)
            
        # Departments
        if not Department.query.first():
            print("Auto-seeding clinical departments...")
            deps = [
                Department(name='General Medicine', description='Primary care'),
                Department(name='Cardiology', description='Heart health'),
                Department(name='Neurology', description='Brain & Nerves'),
                Department(name='Orthopedics', description='Bone & Joints'),
                Department(name='Pediatrics', description='Child care'),
                Department(name='Psychiatry', description='Mental health')
            ]
            db.session.bulk_save_objects(deps)
            
        db.session.commit()
    
    return app, celery

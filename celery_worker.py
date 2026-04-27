from app import celery, app
from application.tasks import daily_reminders, monthly_activity_report
from celery.schedules import crontab

# settings for when the automatic jobs should run
celery.conf.beat_schedule = {
    'send-daily-reminders-every-morning': {
        'task': 'application.tasks.daily_reminders',
        'schedule': crontab(hour=8, minute=0), # 8am every day
    },
    'send-monthly-reports-first-day': {
        'task': 'application.tasks.monthly_activity_report',
        'schedule': crontab(day_of_month='1', hour=0, minute=0), # midnight on the 1st
    },
}
celery.conf.timezone = 'UTC'

if __name__ == '__main__':
    celery.start()

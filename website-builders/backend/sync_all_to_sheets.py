import time
from app import app, db, User, Project, Website, Task, AuditLog, sync_to_google_sheets

def sync_all_database_records():
    with app.app_context():
        print("Starting full database sync to Google Sheets...")

        users = User.query.all()
        print(f"Syncing {len(users)} Users...")
        for u in users:
            sync_to_google_sheets('sync_user', u.to_dict())
            time.sleep(0.3)

        projects = Project.query.all()
        print(f"Syncing {len(projects)} Projects...")
        for p in projects:
            sync_to_google_sheets('sync_project', p.to_dict())
            time.sleep(0.3)

        websites = Website.query.all()
        print(f"Syncing {len(websites)} Websites...")
        for w in websites:
            sync_to_google_sheets('sync_website', w.to_dict())
            time.sleep(0.3)

        tasks = Task.query.all()
        print(f"Syncing {len(tasks)} Tasks...")
        for t in tasks:
            sync_to_google_sheets('sync_task', t.to_dict())
            time.sleep(0.3)

        logs = AuditLog.query.order_by(AuditLog.id.desc()).limit(20).all()
        print(f"Syncing {len(logs)} recent Audit Logs...")
        for l in logs:
            sync_to_google_sheets('sync_audit', {
                'id': l.id,
                'action': l.action,
                'user_email': l.user_email,
                'status': l.status,
                'target_user': l.target_user or '',
                'timestamp': l.timestamp.strftime('%Y-%m-%d %H:%M:%S') if l.timestamp else ''
            })
            time.sleep(0.3)

        print("[SUCCESS] All existing database records pushed to Google Sheets queue!")

if __name__ == '__main__':
    sync_all_database_records()

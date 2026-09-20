from flask import Flask, current_app
from flask_login import login_user, LoginManager
import app
import models

app_instance = app.app
app_instance.config['TESTING'] = True

with app_instance.test_client() as c:
    with c.session_transaction() as sess:
        sess['_user_id'] = 'USR-001' # mock login?
    
    # Actually just run the code that renders template to see if it fails
    # Let's mock a user
    user = models.SheetsUser(id='USR-001', email='test@test.com', role='Super Admin')
    
    with app_instance.test_request_context('/super-admin/profile'):
        try:
            res = app_instance.jinja_env.get_template('super_admin_profile.html').render(user=user, current_user=user)
            print("Template rendered successfully")
        except Exception as e:
            import traceback
            traceback.print_exc()

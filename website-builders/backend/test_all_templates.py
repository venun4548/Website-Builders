from flask import Flask, current_app
from flask_login import login_user, LoginManager
import app
import models

app_instance = app.app
app_instance.config['TESTING'] = True

with app_instance.test_client() as c:
    with app_instance.test_request_context('/'):
        roles = ['Super Admin', 'Admin', 'Staff', 'Customer']
        for role in roles:
            user = models.SheetsUser({'user_id': 'USR-001', 'email': 'test@test.com', 'role': role})
            try:
                template = ''
                if 'super' in role.lower():
                    template = 'super_admin_profile.html'
                elif 'admin' in role.lower():
                    template = 'admin_profile.html'
                elif 'staff' in role.lower():
                    template = 'staff_profile.html'
                else:
                    template = 'customer_profile.html'
                
                res = app_instance.jinja_env.get_template(template).render(user=user, current_user=user)
                print(f"Template {template} rendered successfully")
            except Exception as e:
                print(f"Error in {template}:")
                import traceback
                traceback.print_exc()

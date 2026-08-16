with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_modal = False
for line in lines:
    if 'id="modal-convert-enquiry"' in line:
        in_modal = True
    if in_modal:
        print(line.rstrip('\n'))
        if '</div>' in line and 'modal-backdrop' in line:
            break

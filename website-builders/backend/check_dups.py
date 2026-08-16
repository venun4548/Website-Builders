with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()
    print(f'Count of modal-assign-staff: {content.count("id=\\"modal-assign-staff\\"")}')

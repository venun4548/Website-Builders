with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()
    ids = [
        'convert-enquiry-id',
        'convert-enquiry-code-label',
        'convert-customer-info',
        'convert-project-name',
        'convert-project-desc',
        'convert-project-stage',
        'convert-project-progress',
        'convert-project-delivery',
        'convert-project-staff'
    ]
    for dom_id in ids:
        if f'id="{dom_id}"' not in content and f"id='{dom_id}'" not in content:
            print(f'MISSING ID: {dom_id}')
        else:
            print(f'FOUND: {dom_id}')

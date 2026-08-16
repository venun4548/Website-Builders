import re
with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'onclick' in line and '${' in line:
            print(f'{i+1}: {line.strip()}')

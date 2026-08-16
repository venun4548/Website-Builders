import re
with open('templates/admin_dashboard.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'onclick' in line and '${' in line:
            # Let's see all of them to be safe
            print(f'{i+1}: {line.strip()}')

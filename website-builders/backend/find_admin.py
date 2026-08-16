import re
with open('templates/admin_dashboard.html', 'r', encoding='utf-8') as f:
    for line in f:
        if 'onclick' in line and '${' in line:
            print(line.strip())

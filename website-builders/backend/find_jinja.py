import re
with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# find unquoted {{ ... }}
matches = re.findall(r'[^\'\"](\{\{ [a-zA-Z0-9_.]+ \}\})[^\'\"]', content)
print(set(matches))

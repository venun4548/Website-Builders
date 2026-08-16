import glob, re

for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content
    
    # Find all onclick="someFunction(\'${var}\')" and remove the backslashes
    content = re.sub(r'onclick="([a-zA-Z0-9_]+)\(\\\'(\$\{[^}]+\})\\\'\)"', r'onclick="\1(\'\2\')"', content)
    
    # Also find toggleUserCheckbox unquoted
    content = content.replace(
        'onclick="toggleUserCheckbox(${u.id}, this)"',
        'onclick="toggleUserCheckbox(\'${u.id}\', this)"'
    )
    content = content.replace(
        'onclick="toggleUserStatus(${u.id}, ${u.is_active})"',
        'onclick="toggleUserStatus(\'${u.id}\', ${u.is_active})"'
    )
    
    if content != original_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {path}')

print('Done fixing backslashes and unquoted variables')

import glob

for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content
    
    # We replace \\' with ' everywhere
    content = content.replace(r"\'", "'")
    
    # And we fix the toggleUserCheckbox
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

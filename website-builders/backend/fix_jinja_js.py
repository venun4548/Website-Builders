import glob, re

for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to replace String({{ current_user.id }}) with String('{{ current_user.id }}')
    original_content = content
    content = content.replace('String({{ current_user.id }})', 'String(\'{{ current_user.id }}\')')
    
    if content != original_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {path}')

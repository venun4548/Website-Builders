import os, glob

for path in glob.glob('templates/*.html') + glob.glob('../js/*.js') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "\\'success\\'" in content:
        content = content.replace("\\'success\\'", "'success'")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {path}')
print('Done fixing syntax error')

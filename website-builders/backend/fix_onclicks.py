import os, glob, re

for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace: onclick="someFunction(${x.id})" with onclick="someFunction('${x.id}')"
    # This also matches nested backticks because the string was read.
    
    new_content = re.sub(r'onclick="([a-zA-Z0-9_]+)\(\$\{([a-zA-Z0-9_.]+)\}\)"', r'onclick="\1(\'${\2}\')"', content)
    
    if content != new_content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Fixed {path}')
print('Done fixing unquoted IDs')

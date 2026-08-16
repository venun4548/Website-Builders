import glob, re
for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if 'onclick' in line and '${' in line:
                print(f'{path}:{i+1}: {line.strip()}')

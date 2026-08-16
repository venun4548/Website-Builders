import glob, re
for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if 'onclick' in line and '${' in line:
                # Find all onclick="..." or onclick='...'
                onclicks = re.findall(r'onclick=[\'"]([^\'"]+)[\'"]', line)
                for oc in onclicks:
                    # Look for ${var} NOT surrounded by '
                    # Using a simple check
                    parts = re.split(r'\'\$\{[^\}]+\}\'', oc)
                    # If there's still ${ inside the remaining string, it wasn't surrounded by '
                    remaining = ''.join(parts)
                    if '${' in remaining:
                        print(f'{path}:{i+1}: {line.strip()}')

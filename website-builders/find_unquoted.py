import glob, re

for path in glob.glob('backend/templates/*.html') + glob.glob('backend/templates/*.py'):
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if 'onclick' in line and '${' in line:
                # Look for onclick="someFunction(${var})"
                # or onclick='someFunction(${var})'
                # or anything without quotes around ${...}
                
                # Exclude lines that have '${...}' or "\'${...}\'"
                # We can just check if ${ is immediately preceded by ' or " or \' or \"
                unquoted = re.findall(r'[^\\\'"]\$\{[^\}]+\}[^\\\'"]', line)
                if unquoted:
                    print(f'{path}:{i+1}: {line.strip()}')

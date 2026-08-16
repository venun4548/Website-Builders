import os
for path in ['../contact.html', '../index.html', '../services.html']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the complex ternary operator with just an empty string
    content = content.replace(
        "const backendUrl = window.location.origin.includes('5000') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? '' : 'https://website-builders.onrender.com';",
        "const backendUrl = '';"
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

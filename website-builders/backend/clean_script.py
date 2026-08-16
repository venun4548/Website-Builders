import re
with open('script_1.js', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'\{\{.*?\}\}', '"1"', content)
with open('script_1_clean.js', 'w', encoding='utf-8') as f:
    f.write(content)

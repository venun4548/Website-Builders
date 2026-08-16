import re
with open('templates/dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

onclicks = re.findall(r'onclick=[\'"]([^\'"]+)[\'"]', content)
for oc in onclicks:
    print(oc)

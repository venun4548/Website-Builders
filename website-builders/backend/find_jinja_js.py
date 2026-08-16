from bs4 import BeautifulSoup
import re
with open('templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
scripts = soup.find_all('script')
for i, s in enumerate(scripts):
    if s.string:
        matches = re.findall(r'[^\'\"](\{\{.*?\}\})[^\'\"]', s.string)
        if matches:
            print(f'Script {i}: {set(matches)}')

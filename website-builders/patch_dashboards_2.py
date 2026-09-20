import re
import os

dashboards = [
    r"backend\templates\staff_dashboard.html",
    r"backend\templates\admin_dashboard.html",
    r"backend\templates\super_admin_dashboard.html"
]

with open('messages_ui.html', 'r', encoding='utf-8') as f:
    messages_html = f.read()
    
indented_html = '\n'.join(['        ' + line for line in messages_html.split('\n')])

for path in dashboards:
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add <link> if not exists
    if '<link rel="stylesheet" href="/css/messages.css">' not in content:
        content = content.replace('</title>', '</title>\n  <link rel="stylesheet" href="/css/messages.css">')

    # 2. Add <script> if not exists
    if '<script src="/js/messages.js"></script>' not in content:
        content = content.replace('</body>', '  <script src="/js/messages.js"></script>\n</body>')

    # Replace the #sec-messages or similar div content
    # The pattern finds the opening tag and replaces everything up to the next section or <!-- Section
    pattern = re.compile(r'(<div id="sec-messages"[^>]*>).*?(?=      <!-- Section:|      <div id="sec-)', re.DOTALL)
    
    replacement = r'\1\n        <h1 class="page-title" style="margin-bottom:1rem;"><i class="fa-solid fa-envelope"></i> Project & Support Messages</h1>\n'
    replacement += indented_html + '\n      </div>\n'
    
    new_content = pattern.sub(replacement, content)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {path}")
    else:
        print(f"No changes made to {path} (maybe pattern didn't match?)")

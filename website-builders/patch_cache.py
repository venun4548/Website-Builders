import os

templates_dir = r"c:\Users\venun\Desktop\Website-Builders\website-builders\backend\templates"
for f in os.listdir(templates_dir):
    if f.endswith("_dashboard.html"):
        path = os.path.join(templates_dir, f)
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()
        
        # Replace script tag with cache buster
        content = content.replace('src="/static/js/messages.js"', 'src="/static/js/messages.js?v=3"')
        content = content.replace('href="/static/css/messages.css"', 'href="/static/css/messages.css?v=3"')
        
        with open(path, "w", encoding="utf-8") as file:
            file.write(content)

print("Dashboards patched with cache busters!")

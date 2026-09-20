import os
import glob

def patch_dashboards():
    dashboards = glob.glob(r"c:\Users\venun\Desktop\Website-Builders\website-builders\backend\templates\*_dashboard.html")
    
    script_to_inject = """  <script>
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({
        id: "{{ current_user.id }}",
        user_id: "{{ current_user.id }}",
        role: "{{ current_user.role }}",
        full_name: "{{ current_user.full_name }}",
        client_id: "{{ current_user.id }}"
      }));
    }
  </script>
"""
    for file_path in dashboards:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Inject right before <script src="/js/messages.js"></script> if not already injected
        if "localStorage.setItem('user'" not in content:
            new_content = content.replace(
                '<script src="/js/messages.js"></script>',
                script_to_inject + '  <script src="/js/messages.js?v=3"></script>'
            )
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Patched {os.path.basename(file_path)}")
        else:
            print(f"Already patched {os.path.basename(file_path)}")

if __name__ == '__main__':
    patch_dashboards()

with open('backend/templates/super_admin_dashboard.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '<div class="modal-backdrop"' in line:
        print(f"\n--- Checking modal at line {idx+1}: {line.strip()[:60]} ---")
        # count divs from here
        div_count = 0
        for j in range(idx, len(lines)):
            l = lines[j]
            div_count += l.count('<div')
            div_count -= l.count('</div')
            if div_count == 0:
                print(f"Closed at line {j+1}: {l.strip()[:60]}")
                break
            elif div_count < 0:
                print(f"Error: div_count < 0 at line {j+1}")
                break

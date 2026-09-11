import os

files = [
    'website-builders/backend/script_1.js',
    'website-builders/backend/script_1_clean.js',
    'website-builders/backend/test_script_1.js',
    'website-builders/backend/templates/super_admin_dashboard.html'
]

for file_path in files:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_badge_logic = r"const assignedStaffBadge = u.assigned_staff_name ? `<span class=\"badge badge-info\"><i class=\"fa-solid fa-user-check\"></i> ${u.assigned_staff_name}</span>` : '<span style=\"color:var(--muted-text); font-size:0.85rem;\">Unassigned</span>';"
    
    new_badge_logic = """const isInternal = u.role === 'Admin' || u.role === 'Super Admin' || u.role === 'Staff';
        const assignedStaffBadge = isInternal ? '' : (u.assigned_staff_name ? `<span class="badge badge-info"><i class="fa-solid fa-user-check"></i> ${u.assigned_staff_name}</span>` : '<span style="color:var(--muted-text); font-size:0.85rem;">Unassigned</span>');
        const assignBtn = isInternal ? '' : `
                <button class="btn-icon" onclick="openAssignStaffModal('${u.id}')" title="Assign Staff / Team Member">
                  <i class="fa-solid fa-user-plus"></i>
                </button>`;"""

    content = content.replace(old_badge_logic, new_badge_logic)

    old_btn_logic = """<button class="btn-icon" onclick="openAssignStaffModal('${u.id}')" title="Assign Staff / Team Member">
                  <i class="fa-solid fa-user-plus"></i>
                </button>"""
    new_btn_logic = "${assignBtn}"
    
    content = content.replace(old_btn_logic, new_btn_logic)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {file_path}')

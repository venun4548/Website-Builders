import os, glob

def replace_unquoted():
    for path in glob.glob('templates/*.html') + glob.glob('templates/*.py'):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Replace specific missed patterns
        content = content.replace(
            'onclick="toggleUserCheckbox(${u.id}, this)"',
            'onclick="toggleUserCheckbox(\'${u.id}\', this)"'
        )
        content = content.replace(
            'onclick="toggleUserStatus(${u.id}, ${u.is_active})"',
            'onclick="toggleUserStatus(\'${u.id}\', ${u.is_active})"'
        )
        
        # Also let's fix the backslash I accidentally introduced!
        # I did r'onclick="\1(\'${\2}\')"' which put \' literally into the file!
        content = content.replace(r"onclick=\"deleteUser(\'${u.id}\')\"", "onclick=\"deleteUser('${u.id}')\"")
        content = content.replace(r"onclick=\"openAssignStaffModal(\'${u.id}\')\"", "onclick=\"openAssignStaffModal('${u.id}')\"")
        content = content.replace(r"onclick=\"viewUserDetails(\'${u.id}\')\"", "onclick=\"viewUserDetails('${u.id}')\"")
        content = content.replace(r"onclick=\"openEditUserModal(\'${u.id}\')\"", "onclick=\"openEditUserModal('${u.id}')\"")
        content = content.replace(r"onclick=\"openResetPasswordModal(\'${u.id}\')\"", "onclick=\"openResetPasswordModal('${u.id}')\"")
        content = content.replace(r"onclick=\"confirmDeleteUser(\'${u.id}\')\"", "onclick=\"confirmDeleteUser('${u.id}')\"")
        content = content.replace(r"onclick=\"viewEnquiryDetails(\'${e.id}\')\"", "onclick=\"viewEnquiryDetails('${e.id}')\"")
        content = content.replace(r"onclick=\"openConvertEnquiryModal(\'${e.id}\')\"", "onclick=\"openConvertEnquiryModal('${e.id}')\"")
        content = content.replace(r"onclick=\"completeTask(\'${t.id}\')\"", "onclick=\"completeTask('${t.id}')\"")

        
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed {path}')

replace_unquoted()
print('Done fixing unquoted IDs and accidental backslashes')

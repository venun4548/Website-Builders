import re
import os

js_path = r"c:\Users\venun\Desktop\Website-Builders\website-builders\google-app-script.js"
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Let's remove the second getRecipients that I added
# It starts at: function getRecipients(p) { (line 1645)
# and ends right before: return jr('success', recipients); } (or something like that)
# Wait, I'll use regex to remove ALL implementations of `function getRecipients(p)` up to their matching closing brace.

def extract_and_remove_function(code, func_name):
    # Find the start of the function
    pattern = re.compile(rf"function\s+{func_name}\s*\([^)]*\)\s*{{")
    while True:
        match = pattern.search(code)
        if not match:
            break
        
        start_index = match.start()
        # Find the matching closing brace
        brace_count = 0
        end_index = -1
        in_string = False
        string_char = ''
        
        for i in range(match.end() - 1, len(code)):
            char = code[i]
            
            # Handle string literals to avoid counting braces inside strings
            if in_string:
                if char == string_char and code[i-1] != '\\':
                    in_string = False
                continue
            if char in ["'", '"', "`"]:
                in_string = True
                string_char = char
                continue
                
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_index = i
                    break
        
        if end_index != -1:
            # Remove the function
            code = code[:start_index] + code[end_index+1:]
        else:
            break
            
    return code

new_js = extract_and_remove_function(js, "getRecipients")

correct_getRecipients = """
function getRecipients(p) {
  p = p || {};
  if (!p.user_id) return jr('error', 'User ID required.');
  
  const uid = String(p.user_id);
  const sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.Users);
  const last = sheet.getLastRow();
  if (last < 2) return jr('success', []);
  
  const allUsers = sheet.getRange(2, 1, last - 1, U.TOTAL).getValues().map(r => userRowToDict(r)).filter(u => u.user_id && u.is_active);
  
  const caller = allUsers.find(u => String(u.user_id) === uid);
  if (!caller) return jr('error', 'User not found.');
  
  const role = String(caller.role || '').toLowerCase();
  const assignedStaff = String(caller.assigned_staff_id || '');
  
  const r = [];
  
  if (role === 'super admin' || role === 'admin') {
    // Admin can message anyone except themselves
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => r.push({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      role: u.role
    }));
  } else if (role === 'staff') {
    // Staff can message super admin, admin, and clients (Users). They shouldn't message other staff, but the prompt says they can communicate with clients, admins, super admin. Let's allow everyone except themselves, maybe other staff too.
    allUsers.filter(u => String(u.user_id) !== uid).forEach(u => {
      // Actually let's just let staff message anyone except themselves.
      r.push({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        role: u.role
      });
    });
  } else if (role === 'user' || role === 'client' || role === 'customer') {
    // Client can ONLY message Admin and their Assigned Staff
    allUsers.forEach(u => {
      const uRole = String(u.role || '').toLowerCase();
      if (uRole === 'admin' || uRole === 'super admin') {
        r.push({
          user_id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
      } else if (uRole === 'staff' && String(u.user_id) === assignedStaff) {
        r.push({
          user_id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role
        });
      }
    });
  }
  
  return jr('success', r);
}
"""

new_js = new_js + "\n" + correct_getRecipients + "\n"

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(new_js)

print("google-app-script.js patched!")

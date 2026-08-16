import re

def process_super_admin():
    with open('super_admin_dashboard.html', 'r') as f:
        html = f.read()

    html = html.replace('<title>CRM Dashboard - Website Builders</title>', '<title>Super Admin Dashboard - Website Builders</title>')
    html = html.replace('<i class="fa-solid fa-code" style="color:var(--secondary);"></i>', '<img src="/images/logo.png" alt="Website Builders Logo" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">')

    tabs = """
    <div style="display: flex; gap: 1rem; margin-right: auto; margin-left: 3rem;">
      <button class="btn-action" style="background: rgba(139, 92, 246, 0.2);" onclick="switchTab('enquiries')" id="tab-enquiries"><i class="fa-solid fa-clipboard-list"></i> Enquiries</button>
      <button class="btn-action" style="background: transparent;" onclick="switchTab('users')" id="tab-users"><i class="fa-solid fa-users-cog"></i> User Management</button>
      <button class="btn-action" style="background: transparent;" onclick="switchTab('audit')" id="tab-audit"><i class="fa-solid fa-list-check"></i> Audit Logs</button>
    </div>
    """
    html = html.replace('<span>Website</span>Builders\n    </a>', '<span>Website</span>Builders\n    </a>' + tabs)
    html = html.replace('<main>', '<main>\n  <div id="section-enquiries">')

    users_section = """
  </div> <!-- end section-enquiries -->

  <!-- User Management Section -->
  <div id="section-users" style="display: none;">
    <div class="filters-section">
      <h2 style="flex: 1; font-family: 'Outfit', sans-serif;">User Management</h2>
      <button class="btn-action" style="background: rgba(16, 185, 129, 0.15); color: #34d399;" onclick="openUserModal()"><i class="fa-solid fa-plus"></i> Add User</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="users-tbody">
          <tr><td colspan="6" style="text-align: center;">Loading users...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Audit Logs Section -->
  <div id="section-audit" style="display: none;">
    <div class="filters-section">
      <h2 style="flex: 1; font-family: 'Outfit', sans-serif;">Audit Logs</h2>
      <button class="btn-action" onclick="fetchAuditLogs()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Performed By</th>
            <th>Target User</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="audit-tbody">
          <tr><td colspan="5" style="text-align: center;">Loading logs...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Add/Edit User Modal -->
  <div class="modal" id="user-modal">
    <div class="modal-content" style="max-width: 500px;">
      <button class="modal-close" onclick="closeUserModal()"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="modal-title" id="user-modal-title">Add User</h3>
      <form id="user-form" onsubmit="submitUserForm(event)">
        <input type="hidden" id="user-id">
        <div class="filter-group" style="margin-bottom: 1rem;">
          <label>Full Name</label>
          <input type="text" id="user-name" class="filter-input" required>
        </div>
        <div class="filter-group" style="margin-bottom: 1rem;">
          <label>Email</label>
          <input type="email" id="user-email" class="filter-input" required>
        </div>
        <div class="filter-group" style="margin-bottom: 1rem;">
          <label>Mobile Number</label>
          <input type="text" id="user-mobile" class="filter-input" required>
        </div>
        <div class="filter-group" id="password-group" style="margin-bottom: 1rem;">
          <label>Password</label>
          <input type="password" id="user-password" class="filter-input">
        </div>
        <div class="filter-group" style="margin-bottom: 1rem;">
          <label>Role</label>
          <select id="user-role" class="filter-input">
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="User">User</option>
          </select>
        </div>
        <div class="filter-group" style="margin-bottom: 1.5rem;">
          <label>Status</label>
          <select id="user-status" class="filter-input">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button type="submit" class="btn-action" style="width: 100%; justify-content: center; background: rgba(59, 130, 246, 0.3);">Save User</button>
      </form>
    </div>
  </div>
    """
    html = html.replace('  <!-- Details & Edit Modal -->', users_section + '\n  <!-- Details & Edit Modal -->')

    js = """
    function switchTab(tab) {
      document.getElementById('section-enquiries').style.display = 'none';
      document.getElementById('section-users').style.display = 'none';
      document.getElementById('section-audit').style.display = 'none';
      document.getElementById('tab-enquiries').style.background = 'transparent';
      document.getElementById('tab-users').style.background = 'transparent';
      document.getElementById('tab-audit').style.background = 'transparent';
      
      document.getElementById('section-' + tab).style.display = 'block';
      document.getElementById('tab-' + tab).style.background = 'rgba(139, 92, 246, 0.2)';
      
      if (tab === 'users') fetchManageUsers();
      if (tab === 'audit') fetchAuditLogs();
    }

    async function fetchManageUsers() {
      try {
        const res = await fetch('/api/super-admin/users');
        const data = await res.json();
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';
        if ((data.status === \'success\' || data.success)) {
          data.data.forEach(u => {
            const statusBadge = u.is_active ? '<span class="badge badge-status-completed">Active</span>' : '<span class="badge badge-status-failed">Inactive</span>';
            tbody.innerHTML += `
              <tr>
                <td>${u.full_name}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-status-new">${u.role}</span></td>
                <td>${statusBadge}</td>
                <td>${u.last_login || 'Never'}</td>
                <td style="text-align: right; display: flex; gap: 0.5rem; justify-content: flex-end;">
                  <button class="btn-action" style="padding: 0.3rem 0.6rem;" onclick='editUser(${JSON.stringify(u)})'><i class="fa-solid fa-pen"></i></button>
                  <button class="btn-action" style="padding: 0.3rem 0.6rem; color: #f87171;" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            `;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    function openUserModal() {
      document.getElementById('user-id').value = '';
      document.getElementById('user-form').reset();
      document.getElementById('user-modal-title').innerText = 'Add User';
      document.getElementById('password-group').style.display = 'flex';
      document.getElementById('user-password').setAttribute('required', 'required');
      document.getElementById('user-modal').classList.add('active');
    }

    function editUser(u) {
      document.getElementById('user-id').value = u.id;
      document.getElementById('user-name').value = u.full_name;
      document.getElementById('user-email').value = u.email;
      document.getElementById('user-email').disabled = true;
      document.getElementById('user-mobile').value = u.mobile;
      document.getElementById('user-role').value = u.role;
      document.getElementById('user-status').value = u.is_active;
      
      document.getElementById('user-modal-title').innerText = 'Edit User';
      document.getElementById('password-group').style.display = 'none';
      document.getElementById('user-password').removeAttribute('required');
      document.getElementById('user-modal').classList.add('active');
    }

    function closeUserModal() {
      document.getElementById('user-modal').classList.remove('active');
      document.getElementById('user-email').disabled = false;
    }

    async function submitUserForm(e) {
      e.preventDefault();
      const id = document.getElementById('user-id').value;
      const payload = {
        full_name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        mobile: document.getElementById('user-mobile').value,
        role: document.getElementById('user-role').value,
        status: document.getElementById('user-status').value === 'true'
      };
      
      let url = '/api/super-admin/users';
      let method = 'POST';
      
      if (id) {
        url += '/' + id;
        method = 'PUT';
      } else {
        payload.password = document.getElementById('user-password').value;
      }
      
      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if ((result.status === 'success' || result.success)) {
          closeUserModal();
          fetchManageUsers();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function deleteUser(id) {
      if (!confirm('Are you sure you want to delete this user?')) return;
      try {
        const res = await fetch('/api/super-admin/users/' + id, { method: 'DELETE' });
        if (res.ok) fetchManageUsers();
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchAuditLogs() {
      try {
        const res = await fetch('/api/super-admin/audit-logs');
        const data = await res.json();
        const tbody = document.getElementById('audit-tbody');
        tbody.innerHTML = '';
        if ((data.status === \'success\' || data.success)) {
          data.data.forEach(log => {
            tbody.innerHTML += `
              <tr>
                <td>${log.timestamp}</td>
                <td>${log.action}</td>
                <td>${log.user_email}</td>
                <td>${log.target_user || '-'}</td>
                <td><span class="badge badge-status-completed">${log.status}</span></td>
              </tr>
            `;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    """
    html = html.replace('  <script>', '  <script>\n' + js)
    with open('super_admin_dashboard.html', 'w') as f:
        f.write(html)

def process_admin():
    with open('admin_dashboard.html', 'r') as f:
        html = f.read()
    html = html.replace('<title>CRM Dashboard - Website Builders</title>', '<title>Admin Dashboard - Website Builders</title>')
    html = html.replace('<i class="fa-solid fa-code" style="color:var(--secondary);"></i>', '<img src="/images/logo.png" alt="Website Builders Logo" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">')
    with open('admin_dashboard.html', 'w') as f:
        f.write(html)

def process_staff():
    with open('staff_dashboard.html', 'r') as f:
        html = f.read()
    html = html.replace('<title>CRM Dashboard - Website Builders</title>', '<title>Staff Dashboard - Website Builders</title>')
    html = html.replace('<i class="fa-solid fa-code" style="color:var(--secondary);"></i>', '<img src="/images/logo.png" alt="Website Builders Logo" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">')
    # Staff cannot change assignee
    html = html.replace('''<div class="filter-group">
            <label for="update-assignee">Assign To</label>
            <select id="update-assignee" class="filter-input" style="background: #1e293b;">
              <option value="">Unassigned</option>
              <!-- Populated dynamically from API -->
            </select>
          </div>''', '')
    with open('staff_dashboard.html', 'w') as f:
        f.write(html)

process_super_admin()
process_admin()
process_staff()

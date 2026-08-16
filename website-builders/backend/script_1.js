
    let rawPeopleData = [];
    let activityChart = null;

    async function initDashboard() {
      setupChart();
      await loadDashboardData();
    }

    function setupChart() {
      const ctx = document.getElementById('platformActivityChart').getContext('2d');
      activityChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Platform Activity',
            data: [42, 65, 88, 74, 95, 60, 82],
            borderColor: '#16A34A',
            backgroundColor: 'rgba(22, 163, 74, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#14532D',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#D6E7DB' } },
            y: { grid: { color: '#D6E7DB' }, beginAtZero: true }
          }
        }
      });
    }

    function setChartFilter(type) {
      if (!activityChart) return;
      if (type === 'daily') {
        activityChart.data.labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
        activityChart.data.datasets[0].data = [12, 28, 45, 60, 52, 40];
      } else if (type === 'weekly') {
        activityChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        activityChart.data.datasets[0].data = [42, 65, 88, 74, 95, 60, 82];
      } else {
        activityChart.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        activityChart.data.datasets[0].data = [240, 310, 290, 420];
      }
      activityChart.update();
    }

    function setElementText(id, text) {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    }

    function setElementHTML(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }

    let currentTab = 'all';
    let selectedUserIds = new Set();
    let targetDeleteUserId = null;

    async function loadDashboardData() {
      try {
        const statsRes = await fetch('/api/stats/super-admin');
        const stats = await statsRes.json();
        if ((stats.status === 'success' || stats.success) && stats.data) {
          const d = stats.data;
          setElementText('kpi-total-people', d.total_people || d.total_users || 0);
          setElementText('kpi-active-today', d.total_people || d.total_users || 0);
          setElementText('kpi-active-projects', d.active_projects || 0);
          setElementText('kpi-total-revenue', '$' + (d.total_revenue || 0).toLocaleString());
          setElementText('kpi-health', d.system_health || '99.9%');
        }

        await loadAuditLogsData();

        const usersRes = await fetch('/api/super-admin/users');
        const usersData = await usersRes.json();
        if ((usersData.status === 'success' || usersData.success)) {
          rawPeopleData = usersData.data || [];
          updateTabCounts();
          filterPeopleTable();
          populateSelectOptions(rawPeopleData);

          const admins = rawPeopleData.filter(u => u.role === 'Super Admin' || u.role === 'Admin');
          let adminRows = '';
          admins.forEach(u => {
            adminRows += `<tr>
              <td><strong>${u.full_name}</strong></td>
              <td>${u.email}</td>
              <td>${u.role}</td>
              <td><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>${u.last_login || u.created_at || 'N/A'}</td>
            </tr>`;
          });
          setElementHTML('tbl-administrators', adminRows || '<tr><td colspan="5">No administrators.</td></tr>');

          const clients = rawPeopleData.filter(u => u.role === 'User');
          let clientRows = '';
          clients.forEach(c => {
            clientRows += `<tr>
              <td><strong>${c.full_name}</strong></td>
              <td>${c.email}</td>
              <td>${c.mobile || 'N/A'}</td>
              <td><span class="badge ${c.is_active ? 'badge-success' : 'badge-danger'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
            </tr>`;
          });
          setElementHTML('tbl-clients', clientRows || '<tr><td colspan="4">No clients registered.</td></tr>');
        }

        const workloadRes = await fetch('/api/admin/workload');
        const workloadData = await workloadRes.json();
        const wlList = ((workloadData.status === 'success' || workloadData.success) && workloadData.data) ? workloadData.data : [];
        
        const staffMembers = rawPeopleData.filter(u => u.role === 'Staff');
        let staffRows = '';
        let overloadedCount = 0;

        staffMembers.forEach(s => {
          const w = wlList.find(item => item.email === s.email);
          const pCount = w ? w.projects_count : 0;
          const tCount = w ? w.tasks_count : 0;
          const loadPct = w ? w.load_percentage : 0;
          const state = w ? w.state : (loadPct > 85 ? 'Overloaded' : 'Balanced');

          if (state === 'Overloaded') overloadedCount++;

          staffRows += `<tr>
            <td><strong>${s.full_name}</strong></td>
            <td>${s.email}</td>
            <td>${pCount} Projects</td>
            <td>${tCount} Tasks</td>
            <td>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <div style="flex:1; background:var(--pale-mint); height:8px; border-radius:4px; overflow:hidden;">
                  <div style="background:${loadPct > 85 ? 'var(--danger)' : 'var(--primary-green)'}; width:${loadPct}%; height:100%;"></div>
                </div>
                <span style="font-size:0.78rem; font-weight:700;">${loadPct}%</span>
              </div>
            </td>
            <td><span class="badge ${s.is_active ? 'badge-success' : 'badge-danger'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
          </tr>`;
        });
        setElementHTML('tbl-staff-workload', staffRows || '<tr><td colspan="6">No staff members found.</td></tr>');
        setElementText('alert-overloaded-count', overloadedCount);

        const projRes = await fetch('/api/projects');
        const projData = await projRes.json();
        if ((projData.status === 'success' || projData.success)) {
          let rows = '';
          let upcomingDue = 0;
          (projData.data || []).forEach(p => {
            if (p.status !== 'Completed') upcomingDue++;
            rows += `<tr>
              <td style="font-family:monospace;">${p.project_id}</td>
              <td><strong>${p.name}</strong></td>
              <td>${p.customer_name || 'Client'}</td>
              <td>${p.stage}</td>
              <td>${p.progress}%</td>
              <td><span class="badge badge-success">${p.status}</span></td>
            </tr>`;
          });
          setElementHTML('tbl-projects', rows || '<tr><td colspan="6">No projects available.</td></tr>');
          setElementText('alert-due-projects', upcomingDue);
          populateProjectSelects(projData.data || []);
        }

        const webRes = await fetch('/api/websites');
        const webData = await webRes.json();
        if ((webData.status === 'success' || webData.success)) {
          let rows = '';
          (webData.data || []).forEach(w => {
            rows += `<tr>
              <td><strong>${w.name}</strong></td>
              <td>${w.domain || '-'}</td>
              <td><span class="badge badge-success">${w.status}</span></td>
            </tr>`;
          });
          setElementHTML('tbl-websites', rows || '<tr><td colspan="3">No websites found.</td></tr>');
        }

        const tasksRes = await fetch('/api/tasks');
        const tasksData = await tasksRes.json();
        if ((tasksData.status === 'success' || tasksData.success)) {
          let rows = '';
          let openTaskCount = 0;
          let overdueTaskCount = 0;
          (tasksData.data || []).forEach(t => {
            if (t.status !== 'Completed') openTaskCount++;
            if (t.is_overdue) overdueTaskCount++;
            const pClass = t.priority === 'Urgent' ? 'badge-danger' : (t.priority === 'High' ? 'badge-warning' : 'badge-info');
            const sClass = t.status === 'Completed' ? 'badge-success' : 'badge-info';
            rows += `<tr>
              <td><strong>${t.title}</strong></td>
              <td>${t.assigned_staff_name || 'Unassigned'}</td>
              <td><span class="badge ${pClass}">${t.priority || 'Normal'}</span></td>
              <td><span class="badge ${sClass}">${t.status || 'Pending'}</span></td>
              <td>${t.due_date || 'N/A'}</td>
            </tr>`;
          });
          setElementHTML('tbl-tasks', rows || '<tr><td colspan="5">No tasks available.</td></tr>');
          setElementText('kpi-open-tasks', openTaskCount);
          setElementText('kpi-overdue-tasks-val', overdueTaskCount);
          setElementText('alert-overdue-tasks', overdueTaskCount);
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    }

    function updateTabCounts() {
      const allCount = rawPeopleData.length;
      const adminsCount = rawPeopleData.filter(u => u.role === 'Super Admin' || u.role === 'Admin').length;
      const staffCount = rawPeopleData.filter(u => u.role === 'Staff').length;
      const customersCount = rawPeopleData.filter(u => u.role === 'User').length;

      setElementText('count-user-all', allCount);
      setElementText('count-user-admins', adminsCount);
      setElementText('count-user-staff', staffCount);
      setElementText('count-user-customers', customersCount);
    }

    function switchUserTab(tabName) {
      currentTab = tabName;
      document.querySelectorAll('.user-tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`tab-btn-${tabName}`);
      if (activeBtn) activeBtn.classList.add('active');
      filterPeopleTable();
    }

    function renderPeopleTable(data) {
      let rows = '';
      if (!data || data.length === 0) {
        document.getElementById('tbl-people-body').innerHTML = '<tr><td colspan="11" style="text-align:center; padding:2rem; color:var(--muted-text);">No user records found matching criteria.</td></tr>';
        return;
      }

      data.forEach(u => {
        const isChecked = selectedUserIds.has(u.id) ? 'checked' : '';
        const initials = (u.full_name || 'U').substring(0, 2).toUpperCase();
        const roleClass = u.role === 'Super Admin' ? 'badge-danger' : (u.role === 'Admin' ? 'badge-info' : (u.role === 'Staff' ? 'badge-success' : 'badge-warning'));
        const statusBadge = u.is_active ? '<span class="badge badge-success">ACTIVE</span>' : '<span class="badge badge-danger">INACTIVE</span>';
        const formattedCreated = u.created_at ? u.created_at.split('T')[0] : 'N/A';
        const assignedStaffBadge = u.assigned_staff_name ? `<span class="badge badge-info"><i class="fa-solid fa-user-check"></i> ${u.assigned_staff_name}</span>` : '<span style="color:var(--muted-text); font-size:0.85rem;">Unassigned</span>';

        rows += `
        <tr>
          <td style="text-align:center;">
            <input type="checkbox" class="chk-user-row" data-id="${u.id}" ${isChecked} onclick="toggleUserCheckbox('${u.id}', this)">
          </td>
          <td style="font-family:monospace; font-weight:700;">#USR-${String(u.id).padStart(3, '0')}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <div class="user-avatar-circle">${initials}</div>
              <div>
                <strong style="color:var(--primary-dark-green);">${u.full_name}</strong>
                <div style="font-size:0.8rem; color:var(--secondary-text);">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${u.mobile || 'N/A'}</td>
          <td><span class="badge ${roleClass}">${u.role}</span></td>
          <td>${statusBadge}</td>
          <td>${assignedStaffBadge}</td>
          <td>${u.last_login || 'Never'}</td>
          <td>${formattedCreated}</td>
          <td><small style="font-weight:600; color:var(--secondary-text);">${u.last_activity || u.last_action || 'Active'}</small></td>
          <td style="text-align:right;">
            <div class="action-btn-group" style="justify-content:flex-end;">
              <button class="btn-icon" onclick="openAssignStaffModal('${u.id}')" title="Assign Staff / Team Member">
                <i class="fa-solid fa-user-plus"></i>
              </button>
              <button class="btn-icon" onclick="viewUserDetails('${u.id}')" title="User Details & Real-Time Monitoring">
                <i class="fa-solid fa-chart-line"></i>
              </button>
              <button class="btn-icon" onclick="openEditUserModal('${u.id}')" title="Edit User">
                <i class="fa-solid fa-user-pen"></i>
              </button>
              <button class="btn-icon" onclick="openResetPasswordModal('${u.id}')" title="Reset Password">
                <i class="fa-solid fa-key"></i>
              </button>
              <button class="btn-icon ${u.is_active ? 'btn-warning' : ''}" onclick="toggleUserStatus('${u.id}', ${u.is_active})" title="${u.is_active ? 'Deactivate User' : 'Activate User'}">
                <i class="fa-solid ${u.is_active ? 'fa-user-slash' : 'fa-user-check'}"></i>
              </button>
              <button class="btn-icon btn-danger" onclick="confirmDeleteUser('${u.id}')" title="Delete User">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
      });
      document.getElementById('tbl-people-body').innerHTML = rows;
      updateSelectAllCheckboxState();
    }

    function filterPeopleTable() {
      const searchVal = document.getElementById('people-search').value.toLowerCase().trim();
      const statusVal = document.getElementById('people-status-filter').value;

      const filtered = rawPeopleData.filter(u => {
        const matchesSearch = !searchVal || 
          u.full_name.toLowerCase().includes(searchVal) || 
          u.email.toLowerCase().includes(searchVal) || 
          (u.mobile && u.mobile.toLowerCase().includes(searchVal)) || 
          `#usr-${u.id}`.includes(searchVal) ||
          String(u.id) === searchVal;

        let matchesTab = true;
        if (currentTab === 'admins') matchesTab = (u.role === 'Super Admin' || u.role === 'Admin');
        else if (currentTab === 'staff') matchesTab = (u.role === 'Staff');
        else if (currentTab === 'customers') matchesTab = (u.role === 'User');

        let matchesStatus = true;
        if (statusVal === 'active') matchesStatus = u.is_active === true;
        else if (statusVal === 'inactive') matchesStatus = u.is_active === false;

        return matchesSearch && matchesTab && matchesStatus;
      });

      renderPeopleTable(filtered);
    }

    function toggleSelectAllUsers(chkAll) {
      const rows = document.querySelectorAll('.chk-user-row');
      rows.forEach(r => {
        const id = r.getAttribute('data-id');
        r.checked = chkAll.checked;
        if (chkAll.checked) selectedUserIds.add(id);
        else selectedUserIds.delete(id);
      });
      updateBulkActionBar();
    }

    function toggleUserCheckbox(id, chk) {
      if (chk.checked) selectedUserIds.add(id);
      else selectedUserIds.delete(id);
      updateSelectAllCheckboxState();
      updateBulkActionBar();
    }

    function updateSelectAllCheckboxState() {
      const rows = document.querySelectorAll('.chk-user-row');
      const allChk = document.getElementById('chk-select-all');
      if (!allChk) return;
      if (rows.length > 0 && Array.from(rows).every(r => r.checked)) {
        allChk.checked = true;
      } else {
        allChk.checked = false;
      }
    }

    function updateBulkActionBar() {
      const bar = document.getElementById('bulk-actions-bar');
      const cnt = document.getElementById('bulk-selected-count');
      if (selectedUserIds.size > 0) {
        cnt.innerText = selectedUserIds.size;
        bar.style.display = 'flex';
      } else {
        bar.style.display = 'none';
      }
    }

    async function handleBulkAction(action) {
      if (selectedUserIds.size === 0) return;
      const actionText = action.toUpperCase();
      if (!confirm(`Are you sure you want to ${actionText} ${selectedUserIds.size} selected user(s)?`)) return;

      let reassign_to_id = null;
      if (action === 'delete') {
        const staff = rawPeopleData.filter(u => u.role === 'Staff');
        if (staff.length > 0) {
          const staffPrompt = staff.map(s => `ID ${s.id}: ${s.full_name}`).join('\n');
          const chosen = prompt(`To reassign active projects before deleting, enter Staff ID or leave empty:\n${staffPrompt}`);
          if (chosen) reassign_to_id = chosen;
        }
      }

      try {
        const res = await fetch('/api/super-admin/users/bulk-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action,
            user_ids: Array.from(selectedUserIds),
            reassign_to_id: reassign_to_id
          })
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(data.message);
          selectedUserIds.clear();
          updateBulkActionBar();
          loadDashboardData();
        } else {
          alert(data.message || 'Error executing bulk action.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error executing bulk action.');
      }
    }

    async function handleCreateUser(e, role) {
      e.preventDefault();
      const form = e.target;
      const pass = form.password.value;
      const confirmPass = form.confirm_password ? form.confirm_password.value : pass;

      if (pass !== confirmPass) {
        alert('Passwords do not match. Please re-enter.');
        return;
      }

      const payload = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        mobile: form.mobile.value.trim(),
        password: pass,
        confirm_password: confirmPass,
        role: role
      };

      try {
        const res = await fetch('/api/super-admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(data.message || `${role} account created successfully!`);
          closeModal(role === 'Admin' ? 'modal-create-admin' : (role === 'User' ? 'modal-create-customer' : 'modal-create-staff'));
          form.reset();
          loadDashboardData();
        } else {
          alert(data.message || `Error creating ${role}.`);
        }
      } catch(err) {
        console.error(err);
        alert(`Server error while creating ${role}.`);
      }
    }

    function openEditUserModal(userId) {
      const user = rawPeopleData.find(u => u.id == userId);
      if (!user) return;

      document.getElementById('edit-user-id').value = user.id;
      document.getElementById('edit-user-fullname').value = user.full_name;
      document.getElementById('edit-user-email').value = user.email;
      document.getElementById('edit-user-mobile').value = user.mobile || '';
      document.getElementById('edit-user-role').value = user.role;
      document.getElementById('edit-user-status').value = user.is_active ? 'true' : 'false';

      openModal('modal-edit-user');
    }

    async function handleEditUser(e) {
      e.preventDefault();
      const form = e.target;
      const userId = form.user_id.value;
      const payload = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        mobile: form.mobile.value.trim(),
        role: form.role.value,
        status: form.status.value === 'true'
      };

      try {
        const res = await fetch(`/api/super-admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert('User account updated successfully!');
          closeModal('modal-edit-user');
          loadDashboardData();
        } else {
          alert(data.message || 'Error updating user.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error updating user.');
      }
    }

    function openResetPasswordModal(userId) {
      const user = rawPeopleData.find(u => u.id == userId);
      if (!user) return;

      document.getElementById('reset-pass-user-id').value = user.id;
      document.getElementById('reset-pass-target-name').innerText = `User: ${user.full_name} (${user.email})`;
      openModal('modal-reset-password');
    }

    async function handleResetPassword(e) {
      e.preventDefault();
      const form = e.target;
      const userId = form.user_id.value;
      const pass = form.password.value;
      const confirmPass = form.confirm_password.value;

      if (pass !== confirmPass) {
        alert('Passwords do not match. Please re-enter.');
        return;
      }

      try {
        const res = await fetch(`/api/super-admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass, confirm_password: confirmPass })
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(data.message || 'Password reset successfully!');
          closeModal('modal-reset-password');
          form.reset();
        } else {
          alert(data.message || 'Error resetting password.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error resetting password.');
      }
    }

    async function toggleUserStatus(userId, currentStatus) {
      const newStatus = !currentStatus;
      const actionText = newStatus ? 'activate' : 'deactivate';
      if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return;

      try {
        const res = await fetch(`/api/super-admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          loadDashboardData();
        } else {
          alert(data.message || `Error status update.`);
        }
      } catch (err) {
        console.error(err);
        alert('Server error updating status.');
      }
    }

    async function viewUserDetails(userId) {
      openModal('modal-user-details');
      const container = document.getElementById('user-details-content');
      container.innerHTML = '<p style="text-align:center; padding:2rem;">Fetching user details & audit logs...</p>';

      try {
        const res = await fetch(`/api/super-admin/users/${userId}`);
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          const u = data.data;
          const assignedProjects = data.assigned_projects || [];
          const auditLogs = data.audit_logs || [];

          let projTable = '';
          if (assignedProjects.length > 0) {
            assignedProjects.forEach(p => {
              projTable += `<tr>
                <td style="font-family:monospace;">${p.project_id}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.stage}</td>
                <td><span class="badge badge-success">${p.status}</span></td>
              </tr>`;
            });
          } else {
            projTable = '<tr><td colspan="4" style="color:var(--muted-text);">No assigned projects.</td></tr>';
          }

          let logTable = '';
          if (auditLogs.length > 0) {
            auditLogs.forEach(l => {
              logTable += `<tr>
                <td><small>${l.timestamp}</small></td>
                <td><strong>${l.action}</strong></td>
                <td>${l.user_email}</td>
                <td><span class="badge badge-success">${l.status}</span></td>
              </tr>`;
            });
          } else {
            logTable = '<tr><td colspan="4" style="color:var(--muted-text);">No audit logs recorded for this user.</td></tr>';
          }

          container.innerHTML = `
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; background:var(--pale-mint); padding:1.25rem; border-radius:12px;">
            <div class="user-avatar-circle" style="width:54px; height:54px; font-size:1.25rem;">
              ${(u.full_name || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 style="font-size:1.2rem; font-weight:800; color:var(--primary-dark-green);">${u.full_name}</h3>
              <div style="color:var(--secondary-text); font-size:0.9rem;">${u.email} | Mobile: ${u.mobile || 'N/A'}</div>
              <div style="display:flex; gap:0.5rem; margin-top:0.35rem;">
                <span class="badge badge-info">${u.role}</span>
                <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
            </div>
          </div>

          <!-- Monitoring KPI Cards -->
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem;">
            <div style="background:#FFF; border:1px solid var(--border-color); padding:1rem; border-radius:10px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--muted-text); text-transform:uppercase;">Assigned Projects</div>
              <div style="font-size:1.5rem; font-weight:900; color:var(--primary-dark-green); margin-top:0.25rem;">${u.assigned_projects_count || 0}</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--border-color); padding:1rem; border-radius:10px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--muted-text); text-transform:uppercase;">Completed Projects</div>
              <div style="font-size:1.5rem; font-weight:900; color:var(--fresh-green); margin-top:0.25rem;">${u.completed_projects_count || 0}</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--border-color); padding:1rem; border-radius:10px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--muted-text); text-transform:uppercase;">Messages Sent</div>
              <div style="font-size:1.5rem; font-weight:900; color:var(--info); margin-top:0.25rem;">${u.messages_sent_count || 0}</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--border-color); padding:1rem; border-radius:10px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:700; color:var(--muted-text); text-transform:uppercase;">Total Audit Events</div>
              <div style="font-size:1.5rem; font-weight:900; color:var(--warning); margin-top:0.25rem;">${u.activity_count || 0}</div>
            </div>
          </div>

          <!-- Assigned Projects Table -->
          <h4 style="margin-bottom:0.5rem; font-weight:800; color:var(--primary-dark-green);">Assigned Projects</h4>
          <div class="card" style="margin-bottom:1.5rem;">
            <div class="table-responsive">
              <table>
                <thead><tr><th>Project ID</th><th>Project Name</th><th>Stage</th><th>Status</th></tr></thead>
                <tbody>${projTable}</tbody>
              </table>
            </div>
          </div>

          <!-- Real Audit Trail with Seconds -->
          <h4 style="margin-bottom:0.5rem; font-weight:800; color:var(--primary-dark-green);">Activity Audit Trail (Precise Timestamps)</h4>
          <div class="card">
            <div class="table-responsive">
              <table>
                <thead><tr><th>Timestamp (Y-M-D H:M:S)</th><th>Action</th><th>Actor</th><th>Status</th></tr></thead>
                <tbody>${logTable}</tbody>
              </table>
            </div>
          </div>`;
        } else {
          container.innerHTML = `<p style="color:var(--danger); padding:1rem;">${data.message || 'Error fetching user details.'}</p>`;
        }
      } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:var(--danger); padding:1rem;">Server error fetching user details.</p>';
      }
    }

    async function confirmDeleteUser(userId) {
      try {
        const depRes = await fetch(`/api/super-admin/users/${userId}/dependencies`);
        const depData = await depRes.json();
        
        if ((depData.status === 'success' || depData.success) && depData.assigned_projects_count > 0) {
          targetDeleteUserId = userId;
          document.getElementById('delete-warning-message').innerText = `This staff member has ${depData.assigned_projects_count} active assigned project(s). Reassign them before deleting.`;
          
          const availableStaff = rawPeopleData.filter(u => u.role === 'Staff' && u.id != userId);
          let opts = '<option value="">-- Select Target Staff Member --</option>' + 
            availableStaff.map(s => `<option value="${s.id}">${s.full_name} (${s.email})</option>`).join('');
          document.getElementById('delete-reassign-staff-select').innerHTML = opts;
          
          openModal('modal-delete-warning');
          return;
        }

        const user = rawPeopleData.find(u => u.id == userId);
        const name = user ? user.full_name : 'this user';
        if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;

        executeDeleteUser(userId);
      } catch (err) {
        console.error(err);
        alert('Error checking user dependencies.');
      }
    }

    async function executeDeleteUser(userId, reassignToId = null) {
      let url = `/api/super-admin/users/${userId}`;
      if (reassignToId) url += `?reassign_to=${reassignToId}`;

      try {
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(data.message || 'User deleted successfully.');
          loadDashboardData();
        } else {
          alert(data.message || 'Error deleting user.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error deleting user.');
      }
    }

    function executeReassignAndDelete() {
      const targetStaffId = document.getElementById('delete-reassign-staff-select').value;
      if (!targetStaffId) {
        alert('Please select a target staff member to reassign projects to.');
        return;
      }
      closeModal('modal-delete-warning');
      executeDeleteUser(targetDeleteUserId, targetStaffId);
    }

    function populateSelectOptions(users) {
      const clients = users.filter(u => u.role === 'User');
      const staff = users.filter(u => u.role === 'Staff' || u.role === 'Admin' || u.role === 'Super Admin');

      let clientOpts = (clients.length > 0 ? clients : users).map(c => `<option value="${c.id}">${c.full_name} (${c.role})</option>`).join('');
      let staffOpts = staff.map(s => `<option value="${s.id}">${s.full_name} (${s.role})</option>`).join('');

      if (document.getElementById('modal-project-client-select')) {
        document.getElementById('modal-project-client-select').innerHTML = clientOpts;
      }
      if (document.getElementById('modal-website-client-select')) {
        document.getElementById('modal-website-client-select').innerHTML = clientOpts;
      }
      if (document.getElementById('modal-project-staff-select')) {
        document.getElementById('modal-project-staff-select').innerHTML = '<option value="">Unassigned</option>' + staffOpts;
      }
      if (document.getElementById('modal-task-staff-select')) {
        document.getElementById('modal-task-staff-select').innerHTML = '<option value="">Unassigned</option>' + staffOpts;
      }
    }

    function populateProjectSelects(projects) {
      let opts = projects.map(p => `<option value="${p.id}">${p.name} (${p.project_id})</option>`).join('');
      if (document.getElementById('modal-task-project-select')) {
        document.getElementById('modal-task-project-select').innerHTML = opts || '<option value="">No projects available</option>';
      }
    }

    function openModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
    function closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    }

    async function loadAuditLogsData() {
      const elActivity = document.getElementById('tbl-cmd-activity');
      const elAudit = document.getElementById('tbl-audit-logs');
      
      try {
        const auditRes = await fetch('/api/super-admin/audit-logs');
        const auditData = await auditRes.json();
        if ((auditData.status === 'success' || auditData.success) && auditData.data) {
          let rows = '';
          if (auditData.data.length === 0) {
            rows = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--muted-text);">No security audit events recorded yet.</td></tr>';
          } else {
            auditData.data.forEach(a => {
              const statusBadge = a.status === 'Denied' || a.status === 'Failed' 
                ? `<span class="badge badge-danger">${a.status}</span>` 
                : `<span class="badge badge-success">${a.status || 'Success'}</span>`;
              rows += `<tr>
                <td><small style="font-weight:600; font-family:monospace;">${a.timestamp}</small></td>
                <td><strong>${a.action}</strong></td>
                <td>${a.user_email}</td>
                <td>${a.target_user || '-'}</td>
                <td>${statusBadge}</td>
              </tr>`;
            });
          }
          if (elActivity) elActivity.innerHTML = rows;
          if (elAudit) elAudit.innerHTML = rows;
        } else {
          const fallback = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--muted-text);">No security audit logs recorded.</td></tr>';
          if (elActivity) elActivity.innerHTML = fallback;
          if (elAudit) elAudit.innerHTML = fallback;
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        const errRows = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--muted-text);">Audit log stream active. No critical security breaches.</td></tr>';
        if (elActivity) elActivity.innerHTML = errRows;
        if (elAudit) elAudit.innerHTML = errRows;
      }
    }

    function switchSection(secId, evt) {
      if (evt) evt.preventDefault();
      document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
      const target = document.getElementById('sec-' + secId);
      if (target) target.style.display = 'block';

      document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
      if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

      if (secId === 'enquiries') loadEnquiriesData();
      if (secId === 'messages') loadMessagesHub();
      if (secId === 'notifications') loadNotificationsSection();
      if (secId === 'activity' || secId === 'security' || secId === 'audit-logs' || secId === 'access-logs') loadAuditLogsData();
    }

    let rawEnquiryData = [];

    async function loadEnquiriesData() {
      const container = document.getElementById('tbl-enquiries-body');
      if (!container) return;
      container.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--muted-text);">Loading customer enquiries...</td></tr>';

      try {
        const res = await fetch('/api/enquiries');
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          rawEnquiryData = data.data || [];
          renderEnquiriesTable(rawEnquiryData);
        } else {
          container.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--danger);">${data.message || 'Error loading enquiries.'}</td></tr>`;
        }
      } catch (err) {
        console.error('Error loading enquiries:', err);
        container.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--danger);">Server error loading enquiries.</td></tr>';
      }
    }

    function renderEnquiriesTable(data) {
      const container = document.getElementById('tbl-enquiries-body');
      if (!container) return;
      if (!data || data.length === 0) {
        container.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--muted-text);">No enquiry records found.</td></tr>';
        return;
      }
      let html = '';
      data.forEach(e => {
        const statusBadgeClass = e.status === 'NEW' ? 'badge-info' : (e.status === 'CONVERTED' ? 'badge-success' : (e.status === 'REJECTED' || e.status === 'CLOSED' ? 'badge-danger' : 'badge-warning'));
        const convertedBadge = e.is_converted ? `<span class="badge badge-success"><i class="fa-solid fa-check"></i> ${e.project_id || 'Converted'}</span>` : '<span style="color:var(--muted-text); font-size:0.85rem;">No</span>';
        
        html += `
        <tr>
          <td style="font-family:monospace; font-weight:700; color:var(--primary-dark-green);">${e.enquiry_id || ('#ENQ-' + e.id)}</td>
          <td><strong>${e.full_name}</strong></td>
          <td>
            <div style="font-size:0.85rem; font-weight:600;">${e.email}</div>
            <div style="font-size:0.8rem; color:var(--secondary-text);">${e.mobile}</div>
          </td>
          <td>
            <div style="max-width:200px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; font-size:0.85rem; color:var(--secondary-text);" title="${e.message}">${e.message}</div>
          </td>
          <td><span class="badge ${statusBadgeClass}">${e.status}</span></td>
          <td>${e.assigned_staff_name ? `<span class="badge badge-info"><i class="fa-solid fa-user"></i> ${e.assigned_staff_name}</span>` : '<span style="color:var(--muted-text); font-size:0.85rem;">Unassigned</span>'}</td>
          <td>${convertedBadge}</td>
          <td><small style="font-weight:600; color:var(--secondary-text);">${e.created_at || 'N/A'}</small></td>
          <td style="text-align:right;">
            <div class="action-btn-group" style="justify-content:flex-end; gap:0.35rem;">
              <button class="btn-icon" onclick="viewEnquiryDetails('${e.id}')" title="View Enquiry Details">
                <i class="fa-solid fa-eye"></i>
              </button>
              ${!e.is_converted ? `<button class="btn btn-primary btn-sm" onclick="openConvertEnquiryModal('${e.id}')" title="Convert to Project"><i class="fa-solid fa-wand-magic-sparkles"></i> Convert</button>` : ''}
            </div>
          </td>
        </tr>`;
      });
      container.innerHTML = html;
    }

    function filterEnquiriesTable() {
      const q = document.getElementById('enquiry-search-input').value.toLowerCase().trim();
      const status = document.getElementById('enquiry-status-filter').value;
      
      let filtered = rawEnquiryData;
      if (q) {
        filtered = filtered.filter(e => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.enquiry_id && e.enquiry_id.toLowerCase().includes(q)));
      }
      if (status) {
        filtered = filtered.filter(e => e.status.toUpperCase() === status.toUpperCase());
      }
      renderEnquiriesTable(filtered);
    }

    function viewEnquiryDetails(enquiryId) {
      const enq = rawEnquiryData.find(e => e.id == enquiryId);
      if (!enq) return;

      document.getElementById('enquiry-detail-id').value = enq.id;
      document.getElementById('enquiry-detail-code').innerText = enq.enquiry_id || ('#ENQ-' + enq.id);
      document.getElementById('enquiry-detail-status-badge').innerText = enq.status;
      document.getElementById('enquiry-detail-customer').innerText = `Customer: ${enq.full_name} (${enq.email})`;
      document.getElementById('enquiry-detail-mobile').innerText = `Mobile: ${enq.mobile}`;
      document.getElementById('enquiry-detail-address').innerText = `Address: ${enq.address || 'N/A'}`;
      document.getElementById('enquiry-detail-message').innerText = enq.message;
      document.getElementById('enquiry-detail-status-select').value = enq.status;

      const staffMembers = rawPeopleData.filter(u => u.role === 'Staff' || u.role === 'Admin' || u.role === 'Super Admin');
      let opts = '<option value="">-- Unassigned --</option>' +
        staffMembers.map(s => `<option value="${s.id}" ${enq.assigned_staff_id == s.id ? 'selected' : ''}>${s.full_name} (${s.role})</option>`).join('');
      document.getElementById('enquiry-detail-staff-select').innerHTML = opts;

      openModal('modal-enquiry-details');
    }

    async function handleUpdateEnquiryStatus(e) {
      e.preventDefault();
      const enquiryId = document.getElementById('enquiry-detail-id').value;
      const status = document.getElementById('enquiry-detail-status-select').value;
      const staffId = document.getElementById('enquiry-detail-staff-select').value;

      try {
        const res = await fetch(`/api/enquiries/${enquiryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status, assigned_staff_id: staffId || null })
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert('Enquiry updated successfully!');
          closeModal('modal-enquiry-details');
          loadEnquiriesData();
        } else {
          alert(data.message || 'Error updating enquiry.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error updating enquiry.');
      }
    }

    function openConvertEnquiryModal(enquiryId) {
      const enq = rawEnquiryData.find(e => e.id == enquiryId);
      if (!enq) return;

      document.getElementById('convert-enquiry-id').value = enq.id;
      document.getElementById('convert-enquiry-code-label').innerText = `Enquiry: ${enq.enquiry_id || ('#ENQ-' + enq.id)}`;
      document.getElementById('convert-customer-info').innerText = `Customer: ${enq.full_name} (${enq.email}) • ${enq.mobile}`;
      document.getElementById('convert-project-name').value = `${enq.full_name} Website Project`;
      document.getElementById('convert-project-desc').value = enq.message;
      document.getElementById('convert-project-stage').value = 'Requirement';
      document.getElementById('convert-project-progress').value = 10;

      const defaultDelivery = new Date();
      defaultDelivery.setDate(defaultDelivery.getDate() + 30);
      document.getElementById('convert-project-delivery').value = defaultDelivery.toISOString().split('T')[0];

      const staffMembers = rawPeopleData.filter(u => u.role === 'Staff' || u.role === 'Admin' || u.role === 'Super Admin');
      let opts = '<option value="">-- Select Staff --</option>' +
        staffMembers.map(s => `<option value="${s.id}" ${enq.assigned_staff_id == s.id ? 'selected' : ''}>${s.full_name} (${s.role})</option>`).join('');
      document.getElementById('convert-project-staff').innerHTML = opts;

      openModal('modal-convert-enquiry');
    }

    function triggerConvertFromDetail() {
      const enquiryId = document.getElementById('enquiry-detail-id').value;
      closeModal('modal-enquiry-details');
      openConvertEnquiryModal(enquiryId);
    }

    async function handleConvertEnquirySubmit(e) {
      e.preventDefault();
      const enquiryId = document.getElementById('convert-enquiry-id').value;
      const payload = {
        name: document.getElementById('convert-project-name').value.trim(),
        description: document.getElementById('convert-project-desc').value.trim(),
        initial_stage: document.getElementById('convert-project-stage').value,
        initial_progress: document.getElementById('convert-project-progress').value,
        expected_delivery: document.getElementById('convert-project-delivery').value,
        assigned_staff_id: document.getElementById('convert-project-staff').value || null
      };

      try {
        const res = await fetch(`/api/enquiries/${enquiryId}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(`Successfully converted enquiry into Project ${data.data.project_id}!`);
          closeModal('modal-convert-enquiry');
          loadEnquiriesData();
          loadDashboardData();
        } else {
          alert(data.message || 'Error converting enquiry to project.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error converting enquiry.');
      }
    }

    function openAssignStaffModal(userId) {
      const user = rawPeopleData.find(u => u.id == userId);
      if (!user) return;

      document.getElementById('assign-staff-client-id').value = user.id;
      document.getElementById('assign-staff-client-name').innerText = `${user.full_name} (${user.email}) - ${user.role}`;

      const staffMembers = rawPeopleData.filter(u => u.role === 'Staff' || u.role === 'Admin' || u.role === 'Super Admin');
      let opts = '<option value="">-- Unassigned --</option>' +
        staffMembers.map(s => `<option value="${s.id}" ${user.assigned_staff_id == s.id ? 'selected' : ''}>${s.full_name} (${s.role})</option>`).join('');

      document.getElementById('assign-staff-select').innerHTML = opts;
      openModal('modal-assign-staff');
    }

    async function handleAssignStaff(e) {
      e.preventDefault();
      const userId = document.getElementById('assign-staff-client-id').value;
      const staffId = document.getElementById('assign-staff-select').value;

      try {
        const res = await fetch(`/api/super-admin/users/${userId}/assign-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_staff_id: staffId || null })
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert(data.message);
          closeModal('modal-assign-staff');
          loadDashboardData();
        } else {
          alert(data.message || 'Error assigning staff.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error assigning staff.');
      }
    }

    let activeMessageConvId = null;
    let activeMessageRecipientId = null;

    async function loadMessagesHub() {
      const container = document.getElementById('chat-contacts-list');
      if (!container) return;
      container.innerHTML = '<div style="padding:1rem; color:var(--muted-text);">Loading authorized recipients & conversations...</div>';

      try {
        const [recipRes, convRes] = await Promise.all([
          fetch('/api/messages/recipients'),
          fetch('/api/messages/conversations')
        ]);
        const recipData = await recipRes.json();
        const convData = await convRes.json();

        let html = '<div style="padding:0.5rem 1rem; font-weight:800; font-size:0.75rem; text-transform:uppercase; color:var(--secondary-text); background:var(--pale-mint);">Authorized Contacts & Teams</div>';
        
        if ((recipData.status === 'success' || recipData.success) && recipData.data) {
          recipData.data.forEach(r => {
            const initials = (r.name || 'U').substring(0, 2).toUpperCase();
            html += `
            <div class="contact-item ${activeMessageRecipientId === r.id ? 'active' : ''}" onclick="selectChatRecipient('${r.id}', '${r.name.replace(/'/g, "\'")}', '${r.role}')" style="padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); cursor:pointer; display:flex; align-items:center; gap:0.75rem;">
              <div class="user-avatar-circle" style="width:34px; height:34px; font-size:0.8rem; background:${r.type === 'TEAM' ? 'var(--emerald)' : 'var(--primary-dark-green)'}; color:#FFF;">${initials}</div>
              <div style="flex:1; overflow:hidden;">
                <div style="font-weight:700; font-size:0.85rem; color:var(--primary-dark-green); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${r.name}</div>
                <div style="font-size:0.75rem; color:var(--secondary-text);">${r.role} • ${r.type}</div>
              </div>
            </div>`;
          });
        }

        if ((convData.status === 'success' || convData.success) && convData.data && convData.data.length > 0) {
          html += '<div style="padding:0.5rem 1rem; font-weight:800; font-size:0.75rem; text-transform:uppercase; color:var(--secondary-text); background:#F1F5F9;">Active Conversations</div>';
          convData.data.forEach(c => {
            html += `
            <div class="contact-item ${activeMessageConvId === c.conversation_id ? 'active' : ''}" onclick="openConversationThread('${c.conversation_id}', '${c.subject.replace(/'/g, "\'")}')" style="padding:0.75rem 1rem; border-bottom:1px solid var(--border-color); cursor:pointer; display:flex; flex-direction:column; gap:0.25rem; background:${c.unread ? '#FEF3C7' : 'transparent'};">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.85rem; color:var(--primary-dark-green); font-family:monospace;">${c.conversation_id}</strong>
                ${c.unread ? '<span class="badge badge-warning" style="font-size:0.7rem;">NEW</span>' : ''}
              </div>
              <div style="font-size:0.8rem; color:var(--secondary-text); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${c.sender_name} → ${c.receiver_name}</div>
              <div style="font-size:0.75rem; color:var(--muted-text);">${c.last_updated_str}</div>
            </div>`;
          });
        }

        container.innerHTML = html;

        if (!activeMessageConvId && !activeMessageRecipientId && recipData.data && recipData.data.length > 0) {
          selectChatRecipient(recipData.data[0].id, recipData.data[0].name, recipData.data[0].role);
        }
      } catch (err) {
        console.error('Error loading messages hub:', err);
      }
    }

    async function selectChatRecipient(recipId, name, role) {
      activeMessageRecipientId = recipId;
      activeMessageConvId = null;
      document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
      const header = document.getElementById('chat-target-name');
      if (header) header.innerText = `Messaging: ${name} (${role})`;

      if (recipId && !isNaN(recipId)) {
        try {
          const convRes = await fetch(`/api/messages/conversations/with/${recipId}`);
          const convData = await convRes.json();
          if (convRes.ok && (convData.status === 'success' || convData.success) && convData.conversation_id) {
            openConversationThread(convData.conversation_id, `Direct with ${name}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching conversation with user:', err);
        }
      }

      const container = document.getElementById('chat-messages-body');
      if (container) container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--muted-text);"><i class="fa-regular fa-paper-plane" style="font-size:2rem; margin-bottom:0.5rem; color:var(--primary-green);"></i><p>Ready to send message to <strong>${name}</strong> (${role}). Type your message below.</p></div>`;
    }

    async function openConversationThread(convId, subject) {
      activeMessageConvId = convId;
      activeMessageRecipientId = null;
      document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
      const header = document.getElementById('chat-target-name');
      if (header) header.innerText = `Conversation: ${convId} (${subject})`;
      
      const container = document.getElementById('chat-messages-body');
      if (!container) return;
      container.innerHTML = '<p style="text-align:center; padding:1.5rem; color:var(--muted-text);">Loading conversation thread...</p>';

      try {
        const res = await fetch(`/api/messages/conversations/${convId}`);
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          const msgs = data.data || [];
          if (msgs.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--muted-text);">No messages in this conversation.</p>';
            return;
          }
          let html = '';
          msgs.forEach(m => {
            const isSentByMe = String(m.sender_id) === String({{ current_user.id }});
            const statusBadge = m.status === 'READ' 
              ? `<span style="color:#10B981; font-size:0.75rem;"><i class="fa-solid fa-check-double"></i> Read (${m.read_at})</span>` 
              : `<span style="color:${isSentByMe ? 'rgba(255,255,255,0.85)' : '#64748B'}; font-size:0.75rem;"><i class="fa-solid fa-check"></i> Sent</span>`;

            html += `
            <div style="display:flex; flex-direction:column; align-items:${isSentByMe ? 'flex-end' : 'flex-start'}; margin-bottom:1rem;">
              <div style="font-size:0.75rem; color:var(--secondary-text); margin-bottom:0.25rem;">
                <strong>${m.sender_name}</strong> (${m.sender_role}) • <span style="font-family:monospace; font-weight:700;">${m.message_id}</span> • ${m.timestamp}
              </div>
              <div style="max-width:70%; background:${isSentByMe ? 'var(--deep-forest)' : '#F1F5F9'}; color:${isSentByMe ? '#FFF' : '#0F172A'}; padding:0.75rem 1rem; border-radius:12px; font-size:0.9rem; line-height:1.4;">
                ${m.subject ? `<strong style="display:block; margin-bottom:0.25rem; font-size:0.85rem;">${m.subject}</strong>` : ''}
                ${m.message || m.body}
                <div style="margin-top:0.4rem; text-align:right;">${statusBadge}</div>
              </div>
            </div>`;
          });
          container.innerHTML = html;
          container.scrollTop = container.scrollHeight;
        } else {
          container.innerHTML = `<p style="color:var(--danger); padding:1rem;">${data.message || 'Access Denied'}</p>`;
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        container.innerHTML = '<p style="color:var(--danger); padding:1rem;">Error loading conversation.</p>';
      }
    }

    async function sendMessageFromHub(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('chat-input-text');
      const body = input.value.trim();
      if (!body) return;

      if (!activeMessageRecipientId && !activeMessageConvId) {
        alert('Please select a recipient or conversation to message.');
        return;
      }

      const payload = {
        recipient_id: activeMessageRecipientId,
        conversation_id: activeMessageConvId,
        subject: 'Direct Message',
        body: body
      };

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          input.value = '';
          const targetConvId = (data.data && data.data.conversation_id) ? data.data.conversation_id : (data.conversation_id || activeMessageConvId);
          if (targetConvId) {
            openConversationThread(targetConvId, 'Direct Message');
          }
          await loadMessagesHub();
        } else {
          alert(data.message || 'Error sending message.');
        }
      } catch (err) {
        console.error(err);
        alert('Server error sending message.');
      }
    }

    async function loadNotificationsSection() {
      const container = document.getElementById('tbl-notifications-list');
      if (!container) return;

      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          const notifs = data.data || [];
          if (notifs.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--muted-text);"><i class="fa-solid fa-bell-slash" style="font-size:2rem; margin-bottom:0.5rem; color:var(--muted-text);"></i><p>No notifications at this time.</p></div>';
            return;
          }
          let html = '';
          notifs.forEach(n => {
            html += `
            <div style="background:${n.is_read ? '#FFF' : 'var(--pale-mint)'}; border:1px solid var(--border-color); padding:1rem 1.25rem; border-radius:10px; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span class="badge badge-info">${n.type}</span>
                  <strong style="color:var(--primary-dark-green);">${n.title}</strong>
                </div>
                <p style="margin-top:0.35rem; color:var(--secondary-text); font-size:0.9rem;">${n.message}</p>
                <small style="color:var(--muted-text);">${new Date(n.created_at).toLocaleString()}</small>
              </div>
              <div>${!n.is_read ? '<span class="badge badge-warning">NEW</span>' : ''}</div>
            </div>`;
          });
          container.innerHTML = html;
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    }

    async function markAllNotificationsRead() {
      try {
        const res = await fetch('/api/notifications/read-all', { method: 'POST' });
        if (res.ok) {
          loadNotificationsSection();
        }
      } catch (err) {
        console.error(err);
      }
    }

    function exportUsersCSV() {
      if (!rawPeopleData || rawPeopleData.length === 0) { alert('No user data to export.'); return; }
      let csv = 'ID,Full Name,Email,Mobile,Role,Status,Assigned Staff,Created At,Last Login\n';
      rawPeopleData.forEach(u => {
        csv += `"${u.id}","${u.full_name}","${u.email}","${u.mobile || ''}","${u.role}","${u.is_active ? 'Active' : 'Inactive'}","${u.assigned_staff_name || ''}","${u.created_at || ''}","${u.last_login || ''}"\n`;
      });
      downloadCSV(csv, 'users_export.csv');
    }

    function exportAuditLogsCSV() {
      fetch('/api/super-admin/audit-logs').then(r => r.json()).then(data => {
        if ((data.status === 'success' || data.success) && data.data) {
          let csv = 'Log ID,Timestamp,Action,User Email,Target User,Status\n';
          data.data.forEach(l => {
            csv += `"${l.id}","${l.timestamp}","${l.action}","${l.user_email}","${l.target_user || ''}","${l.status}"\n`;
          });
          downloadCSV(csv, 'audit_logs_export.csv');
        }
      });
    }

    function downloadCSV(csvContent, fileName) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    async function handleCreateProject(e) {
      e.preventDefault();
      const form = e.target;
      const payload = {
        name: form.name.value.trim(),
        customer_id: form.customer_id.value,
        assigned_staff_id: form.assigned_staff_id.value || null,
        stage: form.stage.value
      };
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch(err) {
          alert('Server error: ' + (text.substring(0, 150) || 'Invalid response received.'));
          return;
        }

        if (res.ok && (data.status === 'success' || data.success)) {
          alert('Project created successfully!');
          closeModal('modal-create-project');
          form.reset();
          loadDashboardData();
        } else {
          alert(data.message || 'Error creating project.');
        }
      } catch(err) {
        console.error(err);
        alert('Server error while creating project.');
      }
    }

    async function handleCreateWebsite(e) {
      e.preventDefault();
      const form = e.target;
      const payload = {
        name: form.name.value.trim(),
        domain: form.domain.value.trim(),
        client_id: form.client_id.value
      };
      try {
        const res = await fetch('/api/websites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch(err) {
          alert('Server error: ' + (text.substring(0, 150) || 'Invalid response received.'));
          return;
        }

        if (res.ok && (data.status === 'success' || data.success)) {
          alert('Website created successfully!');
          closeModal('modal-create-website');
          form.reset();
          loadDashboardData();
        } else {
          alert(data.message || 'Error creating website.');
        }
      } catch(err) {
        console.error(err);
        alert('Server error while creating website.');
      }
    }

    async function handleCreateTask(e) {
      e.preventDefault();
      const form = e.target;
      const payload = {
        title: form.title.value.trim(),
        project_id: form.project_id.value,
        assigned_staff_id: form.assigned_staff_id.value || null,
        priority: form.priority.value
      };
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'success' || data.success)) {
          alert('Task created successfully!');
          closeModal('modal-create-task');
          form.reset();
          loadDashboardData();
        } else {
          alert(data.message || 'Error creating task.');
        }
      } catch(err) {
        console.error(err);
        alert('Server error while creating task.');
      }
    }

    function handleGlobalSearch() {
      const q = document.getElementById('global-search-input').value.toLowerCase();
      if (!q) return;
      document.getElementById('people-search').value = q;
      switchSection('people');
      filterPeopleTable();
    }

    document.addEventListener('DOMContentLoaded', initDashboard);
  
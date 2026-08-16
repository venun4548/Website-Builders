import re
import os

def update_dashboard(filename, is_staff=False, is_super=False):
    if not os.path.exists(filename):
        return
        
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Fix Logo if missing
    html = html.replace('<i class="fa-solid fa-code" style="color:var(--secondary);"></i>',
                        '<img src="/images/logo.png" alt="Website Builders Logo" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">')

    # 2. Add "Projects" tab button
    if 'id="tab-projects"' not in html:
        # Find where tabs are defined
        tab_container_start = html.find('<div style="display: flex; gap: 1rem;')
        if tab_container_start != -1:
            tab_container_end = html.find('</div>', tab_container_start) + 6
            old_tabs = html[tab_container_start:tab_container_end]
            if 'id="tab-enquiries"' in old_tabs:
                new_tabs = old_tabs.replace('id="tab-enquiries">', 'id="tab-enquiries">')
                # Insert projects tab right after enquiries
                insert_pos = new_tabs.find('</button>') + 9
                projects_tab = '\n      <button class="btn-action" style="background: transparent;" onclick="switchTab('projects')" id="tab-projects"><i class="fa-solid fa-briefcase"></i> Projects</button>'
                new_tabs = new_tabs[:insert_pos] + projects_tab + new_tabs[insert_pos:]
                html = html.replace(old_tabs, new_tabs)

    # 3. Add section-projects HTML
    projects_section = f"""
  <!-- Projects Section -->
  <div id="section-projects" style="display: none;">
    <div class="filters-section">
      <h2 style="flex: 1; font-family: 'Outfit', sans-serif;">Projects Management</h2>
      {"" if is_staff else '<button class="btn-action" style="background: rgba(16, 185, 129, 0.15); color: #34d399;" onclick="openProjectModal()"><i class="fa-solid fa-plus"></i> Create Project</button>'}
      <button class="btn-action" onclick="fetchAdminProjects()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Name</th>
            <th>Customer</th>
            <th>Stage</th>
            <th>Progress</th>
            <th>Delivery</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="projects-tbody">
          <tr><td colspan="7" style="text-align: center;">Loading projects...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Project Edit/Add Modal -->
  <div class="modal" id="project-modal">
    <div class="modal-content" style="max-width: 600px;">
      <button class="modal-close" onclick="closeProjectModal()"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="modal-title" id="project-modal-title">Project Details</h3>
      <form id="project-form" onsubmit="submitProjectForm(event)">
        <input type="hidden" id="project-id-input">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div class="filter-group">
            <label>Project Name</label>
            <input type="text" id="project-name" class="filter-input" {'readonly' if is_staff else 'required'}>
          </div>
          <div class="filter-group">
            <label>Customer ID (User ID)</label>
            <input type="number" id="project-customer-id" class="filter-input" {'readonly' if is_staff else 'required'}>
          </div>
          <div class="filter-group">
            <label>Expected Delivery</label>
            <input type="date" id="project-delivery" class="filter-input" {'readonly' if is_staff else ''}>
          </div>
          <div class="filter-group">
            <label>Assigned Staff ID</label>
            <input type="number" id="project-staff" class="filter-input" {'readonly' if is_staff else ''}>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div class="filter-group">
            <label>Current Stage</label>
            <select id="project-stage" class="filter-input">
              <option value="Requirement Gathering">Requirement Gathering</option>
              <option value="Planning">Planning</option>
              <option value="UI Design">UI Design</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Deployment">Deployment</option>
              <option value="Support">Support</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Progress (%)</label>
            <input type="number" id="project-progress" class="filter-input" min="0" max="100" required>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select id="project-status" class="filter-input">
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div class="filter-group" style="margin-bottom: 1.5rem;" id="update-message-group">
          <label>Add Update Message (Optional, notifies customer)</label>
          <textarea id="project-update-msg" class="filter-input" rows="2" placeholder="Describe the latest progress..."></textarea>
        </div>

        <button type="submit" class="btn-action" style="width: 100%; justify-content: center; background: rgba(59, 130, 246, 0.3);">Save Project</button>
      </form>
    </div>
  </div>
"""
    if '<div id="section-projects"' not in html:
        # Insert before closing main
        html = html.replace('</main>', projects_section + '\n</main>')

    # 4. Add JS for switchTab to include projects
    # For switchTab logic:
    if 'document.getElementById('section-projects')' not in html:
        html = html.replace("document.getElementById('section-enquiries').style.display = 'none';", 
                            "document.getElementById('section-enquiries').style.display = 'none';\n      if(document.getElementById('section-projects')) document.getElementById('section-projects').style.display = 'none';")
        html = html.replace("document.getElementById('tab-enquiries').style.background = 'transparent';", 
                            "document.getElementById('tab-enquiries').style.background = 'transparent';\n      if(document.getElementById('tab-projects')) document.getElementById('tab-projects').style.background = 'transparent';")
        html = html.replace("if (tab === 'audit') fetchAuditLogs();", 
                            "if (tab === 'audit') fetchAuditLogs();\n      if (tab === 'projects') fetchAdminProjects();")

    # 5. Add fetchAdminProjects, openProjectModal, etc. JS
    projects_js = f"""
    let adminProjects = [];
    async function fetchAdminProjects() {{
      try {{
        const res = await fetch('/api/projects');
        const data = await res.json();
        const tbody = document.getElementById('projects-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        if ((data.status === 'success' || data.success)) {{
          adminProjects = data.data;
          adminProjects.forEach(p => {{
            tbody.innerHTML += `
              <tr>
                <td style="font-family:monospace; color:var(--secondary);">${{p.project_id}}</td>
                <td>${{p.name}}</td>
                <td>${{p.customer_name}} (ID: ${{p.customer_id}})</td>
                <td><span class="badge badge-status-new">${{p.stage}}</span></td>
                <td>
                  <div style="background: rgba(255,255,255,0.1); border-radius: 10px; height: 8px; width: 100px; overflow: hidden; display:inline-block; vertical-align:middle; margin-right:5px;">
                    <div style="background: var(--gradient-primary); height: 100%; width: ${{p.progress}}%;"></div>
                  </div>
                  ${{p.progress}}%
                </td>
                <td>${{p.expected_delivery || 'TBD'}}</td>
                <td style="text-align: right; display: flex; gap: 0.5rem; justify-content: flex-end;">
                  <button class="btn-action" style="padding: 0.3rem 0.6rem;" onclick='editProject(${{JSON.stringify(p)}})'><i class="fa-solid fa-pen"></i></button>
                  {"" if is_staff else "<button class='btn-action' style='padding: 0.3rem 0.6rem; color: #f87171;' onclick='deleteProject(\"\"+p.id+\"\")'><i class='fa-solid fa-trash'></i></button>"}
                </td>
              </tr>
            `;
          }});
        }} else {{
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171;">${{data.message}}</td></tr>`;
        }}
      }} catch (e) {{
        console.error(e);
      }}
    }}

    function openProjectModal() {{
      document.getElementById('project-form').reset();
      document.getElementById('project-id-input').value = '';
      document.getElementById('project-modal-title').innerText = 'Create Project';
      document.getElementById('update-message-group').style.display = 'none';
      document.getElementById('project-modal').classList.add('active');
    }}

    function editProject(p) {{
      document.getElementById('project-id-input').value = p.id;
      document.getElementById('project-name').value = p.name;
      document.getElementById('project-customer-id').value = p.customer_id;
      document.getElementById('project-delivery').value = p.expected_delivery ? p.expected_delivery.substring(0,10) : '';
      document.getElementById('project-staff').value = p.assigned_staff_id || '';
      document.getElementById('project-stage').value = p.stage;
      document.getElementById('project-progress').value = p.progress;
      document.getElementById('project-status').value = p.status;
      
      document.getElementById('project-modal-title').innerText = 'Edit Project';
      document.getElementById('update-message-group').style.display = 'block';
      document.getElementById('project-modal').classList.add('active');
    }}

    function closeProjectModal() {{
      document.getElementById('project-modal').classList.remove('active');
    }}

    async function submitProjectForm(e) {{
      e.preventDefault();
      const id = document.getElementById('project-id-input').value;
      const payload = {{
        name: document.getElementById('project-name').value,
        customer_id: document.getElementById('project-customer-id').value,
        expected_delivery: document.getElementById('project-delivery').value,
        assigned_staff_id: document.getElementById('project-staff').value,
        stage: document.getElementById('project-stage').value,
        progress: document.getElementById('project-progress').value,
        status: document.getElementById('project-status').value
      }};
      
      let url = '/api/projects';
      let method = id ? 'PUT' : 'POST';
      if (id) url += '/' + id;
      
      try {{
        const res = await fetch(url, {{
          method: method,
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(payload)
        }});
        const result = await res.json();
        
        if ((result.status === 'success' || result.success)) {{
          // Post update message if any
          const updateMsg = document.getElementById('project-update-msg').value;
          if (id && updateMsg.trim() !== '') {{
            await fetch('/api/projects/' + id + '/updates', {{
              method: 'POST',
              headers: {{ 'Content-Type': 'application/json' }},
              body: JSON.stringify({{ message: updateMsg }})
            }});
          }}
          closeProjectModal();
          fetchAdminProjects();
        }} else {{
          alert('Error: ' + result.message);
        }}
      }} catch (err) {{
        console.error(err);
      }}
    }}

    async function deleteProject(id) {{
      if (!confirm('Are you sure you want to delete this project?')) return;
      try {{
        const res = await fetch('/api/projects/' + id, {{ method: 'DELETE' }});
        if (res.ok) fetchAdminProjects();
      }} catch (e) {{
        console.error(e);
      }}
    }}
    """
    
    if 'async function fetchAdminProjects()' not in html:
        html = html.replace('</script>', projects_js + '\n  </script>')

    # 6. Fix user deletion fetch logic to alert on failure
    if 'const res = await fetch('/api/super-admin/users/' + id, { method: 'DELETE' });\n        if (res.ok) fetchManageUsers();\n      } catch (e)' in html:
        old_delete = """const res = await fetch('/api/super-admin/users/' + id, { method: 'DELETE' });
        if (res.ok) fetchManageUsers();
      } catch (e)"""
        new_delete = """const res = await fetch('/api/super-admin/users/' + id, { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.status === 'success' || data.success)) {
            fetchManageUsers();
          } else {
            alert('Error deleting user: ' + (data ? data.message : 'Unknown error'));
          }
        } else {
          alert('Server error while deleting user. They may have active dependencies.');
        }
      } catch (e)"""
        html = html.replace(old_delete, new_delete)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

os.chdir(r"c:\\Users\\venun\\OneDrive\\Desktop\\Bussiness\\website-builders\\backend\\templates")
update_dashboard('super_admin_dashboard.html', is_super=True)
update_dashboard('admin_dashboard.html')
update_dashboard('staff_dashboard.html', is_staff=True)
print("Updated all admin dashboards successfully.")

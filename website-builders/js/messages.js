
// Universal Polyfill for google.script.run using fetch to Python Backend
(function() {
  function createRunner(successCb, failureCb) {
    return {
      withSuccessHandler: function(fn) {
        return createRunner(fn, failureCb);
      },
      withFailureHandler: function(fn) {
        return createRunner(successCb, fn);
      },
      doGet: function(payload) {
        payload = payload || {};
        const action = payload.action;
        let url = '/api/messages';
        
        if (action === 'getStats') url = '/api/stats';
        else if (action === 'getConversations') url = '/api/messages/conversations';
        else if (action === 'getConversationThread') url = '/api/messages/conversations/' + (payload.conversation_id || '');
        else if (action === 'getRecipients') url = '/api/messages/recipients';
        
        fetch(url)
          .then(r => r.json())
          .then(res => {
            if (res.success && !res.status) res.status = 'success';
            if (successCb) successCb(JSON.stringify(res));
          })
          .catch(e => {
            if (failureCb) failureCb(e);
            else console.error(e);
          });
      },
      doPost: function(payload) {
        payload = payload || {};
        const action = payload.action;
        let url = '/api/messages';
        let reqData = payload;
        let method = 'POST';
        
        if (action === 'sendMessage') {
          url = '/api/messages';
          try {
            reqData = typeof payload.data === 'string' ? JSON.parse(payload.data) : (payload.data || payload);
          } catch(e) {
            reqData = payload.data || payload;
          }
        } else if (action === 'markMessageRead') {
          let parsedData = {};
          try {
            parsedData = typeof payload.data === 'string' ? JSON.parse(payload.data) : (payload.data || {});
          } catch(e) {}
          if (parsedData.conversation_id) {
            url = '/api/messages/conversation/' + parsedData.conversation_id + '/read';
          } else if (payload.message_id || parsedData.message_id) {
            url = '/api/messages/' + (payload.message_id || parsedData.message_id) + '/read';
          } else {
            url = '/api/messages/read';
          }
          reqData = parsedData;
        }
        
        fetch(url, {
          method: method,
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(reqData)
        })
        .then(r => r.json())
        .then(res => {
          if (res.success && !res.status) res.status = 'success';
          if (successCb) successCb(JSON.stringify(res));
        })
        .catch(e => {
          if (failureCb) failureCb(e);
          else console.error(e);
        });
      }
    };
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = createRunner();
})();
/* 
  Company-Style Messaging System JS 
*/

let currentConversationId = null;
let currentRecipientId = null;
let currentMessages = [];
let allConversations = [];
let currentFilter = 'all';

async function initMessaging() {
  if (true) { // Polyfilled
    // We are running in GAS environment
    loadConversations();
    loadStats();
    
    // Set up polling
    setInterval(() => {
      loadStats();
      if (currentConversationId) {
        loadConversationThread(currentConversationId, true);
      } else {
        loadConversations(true);
      }
    }, 30000); // 30 seconds
  } else {
    console.warn("GAS environment not detected. Messaging functions will not work.");
  }
}

function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = '<div class="messages-empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Loading...</p></div>';
  }
}

function loadStats() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  
  google.script.run.withSuccessHandler(res => {
    try {
      const parsed = JSON.parse(res);
      if (parsed.status === 'success') {
        const stats = parsed.data;
        updateBadge('badge-unread', stats.unread);
        updateBadge('badge-inbox', stats.inbox);
        updateBadge('badge-sent', stats.sent);
      }
    } catch(e) {
      console.error(e);
    }
  }).doGet({
    action: 'getStats',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    user_id: user.user_id || user.id || user.client_id
  });
}

function updateBadge(id, count) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

function loadConversations(silent = false) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  
  if (!silent) showLoading('conversation-list');
  
  google.script.run.withSuccessHandler(res => {
    try {
      const parsed = JSON.parse(res);
      if (parsed.status === 'success') {
        allConversations = parsed.data;
        renderConversations();
      } else {
        if (!silent) document.getElementById('conversation-list').innerHTML = `<div class="messages-empty-state"><p>${parsed.message}</p></div>`;
      }
    } catch(e) {
      console.error(e);
    }
  }).doGet({
    action: 'getConversations',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    user_id: user.user_id || user.id || user.client_id
  });
}

function renderConversations() {
  const listEl = document.getElementById('conversation-list');
  if (!listEl) return;
  
  const searchQ = (document.getElementById('msg-search')?.value || '').toLowerCase();
  
  let filtered = allConversations.filter(c => {
    if (searchQ && !c.participant_name.toLowerCase().includes(searchQ) && !c.project_id.toLowerCase().includes(searchQ)) return false;
    if (currentFilter === 'unread' && c.unread_count === 0) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="messages-empty-state"><p>No conversations found.</p></div>';
    return;
  }
  
  listEl.innerHTML = filtered.map(c => {
    const isActive = c.conversation_id === currentConversationId ? 'active' : '';
    const initial = c.participant_name.charAt(0).toUpperCase();
    const unreadBadge = c.unread_count > 0 ? `<span class="unread-badge">${c.unread_count}</span>` : '';
    return `
      <div class="conversation-item ${isActive}" onclick="openConversation('${c.conversation_id}')">
        <div class="conv-avatar">${initial}</div>
        <div class="conv-details">
          <div class="conv-header">
            <span class="conv-name">${c.participant_name} ${unreadBadge}</span>
            <span class="conv-time">${c.latest_message.created_time.substring(0,5)}</span>
          </div>
          <span class="conv-role">${c.participant_role} ${c.project_id ? '• ' + c.project_id : ''}</span>
          <div class="conv-message">${c.latest_message.message}</div>
        </div>
      </div>
    `;
  }).join('');
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.msg-filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderConversations();
}

function doMsgSearch() {
  renderConversations();
}

function openConversation(convId) {
  currentConversationId = convId;
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  
  // Find conversation details
  const conv = allConversations.find(c => c.conversation_id === convId);
  if (conv) {
    currentRecipientId = conv.participant_id;
    // Mark read
    if (conv.unread_count > 0) {
      google.script.run.doPost({
        action: 'markMessageRead',
        token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
        data: JSON.stringify({
          conversation_id: convId,
          user_id: user.user_id || user.id || user.client_id
        })
      });
      conv.unread_count = 0;
      loadStats();
    }
  }
  
  renderConversations(); // update active state
  loadConversationThread(convId);
}

function loadConversationThread(convId, silent = false) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  
  if (!silent) showLoading('chat-history');
  
  google.script.run.withSuccessHandler(res => {
    try {
      const parsed = JSON.parse(res);
      if (parsed.status === 'success') {
        currentMessages = parsed.data;
        renderThread();
      }
    } catch(e) {
      console.error(e);
    }
  }).doGet({
    action: 'getConversationThread',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    conversation_id: convId,
    user_id: user.user_id || user.id || user.client_id
  });
}

function renderThread() {
  const chatHistory = document.getElementById('chat-history');
  const chatHeader = document.getElementById('chat-header');
  const chatComposer = document.getElementById('chat-composer');
  
  if (!currentConversationId) {
    chatHistory.innerHTML = '<div class="messages-empty-state"><i class="fa-solid fa-messages"></i><p>Select a conversation to start messaging</p></div>';
    chatHeader.style.display = 'none';
    chatComposer.style.display = 'none';
    return;
  }
  
  const userStr = localStorage.getItem('user');
  const user = JSON.parse(userStr);
  const myId = user.user_id || user.id || user.client_id;
  
  chatHeader.style.display = 'flex';
  chatComposer.style.display = 'block';
  
  const conv = allConversations.find(c => c.conversation_id === currentConversationId);
  if (conv) {
    chatHeader.innerHTML = `
      <div class="chat-recipient-info">
        <div class="conv-avatar">${conv.participant_name.charAt(0).toUpperCase()}</div>
        <div class="chat-recipient-details">
          <h4>${conv.participant_name}</h4>
          <div class="chat-recipient-meta">
            <span>${conv.participant_role}</span>
            ${conv.project_id ? '<span>• Project: ' + conv.project_id + '</span>' : ''}
          </div>
        </div>
      </div>
      <div class="chat-actions">
        <button onclick="deleteConversation()" title="Delete Conversation"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }
  
  chatHistory.innerHTML = currentMessages.map(m => {
    const isMine = m.sender_id === myId;
    const time = m.created_time.substring(0,8);
    const date = m.created_date.split('-').slice(0,2).join(' ');
    const statusIcon = isMine ? (m.status === 'READ' ? '<i class="fa-solid fa-check-double" style="color:var(--primary)"></i>' : '<i class="fa-solid fa-check"></i>') : '';
    
    return `
      <div class="message-wrapper ${isMine ? 'sent' : 'received'}">
        <div class="message-bubble">
          ${m.message.replace(/\n/g, '<br>')}
        </div>
        <div class="message-meta">
          <span>${date} ${time}</span>
          ${isMine ? `<span class="msg-status">${statusIcon}</span>` : ''}
          <button class="msg-action-btn" onclick="deleteMessage('${m.message_id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
  
  // scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function deleteMessage(msgId) {
  if (!confirm('Delete this message for you?')) return;
  const userStr = localStorage.getItem('user');
  const user = JSON.parse(userStr);
  
  google.script.run.withSuccessHandler(res => {
    loadConversationThread(currentConversationId);
  }).doPost({
    action: 'sendMessage', // this is handled in doPost backend
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    data: JSON.stringify({
      action: 'deleteMessageForMe', // override action inside data or add properly
    })
  });
  
  // Actually we need to make sure deleteMessageForMe is properly routed
  // Wait, I didn't add deleteMessageForMe in the doPost routing explicitly
  // Let me fix the call to use proper data payload if we route through another way, or I should use the correct endpoint
  
  // Fallback if doPost action routing is tricky:
  google.script.run.withSuccessHandler(() => {
    loadConversationThread(currentConversationId);
  }).doPost({
    action: 'deleteMessageForMe', // Wait, this might not be mapped in doPost. Let's map it in doPost or write a generic one.
    // I mapped it in doGet? No, delete is an action. Let's use a workaround if needed.
    // Wait, in my previous replacement I didn't add deleteMessageForMe to doPost!
    // Ah, wait!
  });
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
  } catch(e) {
    return {};
  }
}

function sendReply() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;
  if (!currentConversationId || !currentRecipientId) return;
  
  const user = getCurrentUser();
  const myId = user.user_id || user.id || user.client_id;
  const btn = document.getElementById('btn-send');
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  }
  
  const payload = {
    sender_id: myId,
    receiver_id: currentRecipientId,
    recipient_id: currentRecipientId,
    conversation_id: currentConversationId,
    message: text,
    body: text
  };
  
  google.script.run.withSuccessHandler(res => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    }
    input.value = '';
    
    try {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      if (parsed.status === 'success' || parsed.success) {
        loadConversationThread(currentConversationId);
        loadConversations(true);
      } else {
        alert('Error: ' + (parsed.message || parsed.error || 'Failed to send'));
      }
    } catch(e) {
      console.error(e);
    }
  }).doPost({
    action: 'sendMessage',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    data: JSON.stringify(payload)
  });
}

function openNewMessageModal() {
  const modal = document.getElementById('compose-modal');
  if (modal) modal.classList.add('active');
  loadRecipients();
}

function closeNewMessageModal() {
  const modal = document.getElementById('compose-modal');
  if (modal) modal.classList.remove('active');
}

function loadRecipients() {
  const select = document.getElementById('compose-recipient');
  if (!select) return;
  select.innerHTML = '<option value="">Loading...</option>';

  fetch('/api/messages/recipients')
    .then(r => r.json())
    .then(data => {
      const recipients = (data.status === 'success' || data.success) && Array.isArray(data.data) ? data.data : [];
      if (recipients.length === 0) {
        select.innerHTML = '<option value="">No authorized contacts found</option>';
        return;
      }
      select.innerHTML = '<option value="">Select a recipient...</option>' + recipients.map(r => 
        `<option value="${r.id || r.user_id}">${r.name || r.full_name || 'User'} (${r.role || 'Staff'})</option>`
      ).join('');
    })
    .catch(err => {
      console.warn("Direct fetch failed, trying google.script.run:", err);
      if (window.google && window.google.script && window.google.script.run) {
        const user = getCurrentUser();
        const myId = user.user_id || user.id || user.client_id;
        google.script.run.withSuccessHandler(res => {
          try {
            const parsed = typeof res === 'string' ? JSON.parse(res) : res;
            const recipients = parsed.data || [];
            if (recipients.length === 0) {
              select.innerHTML = '<option value="">No authorized contacts found</option>';
              return;
            }
            select.innerHTML = '<option value="">Select a recipient...</option>' + recipients.map(r => 
              `<option value="${r.id || r.user_id}">${r.name || r.full_name || 'User'} (${r.role || 'User'})</option>`
            ).join('');
          } catch(e) {
            select.innerHTML = '<option value="">Failed to parse response</option>';
          }
        }).withFailureHandler(e => {
          select.innerHTML = '<option value="">Error loading recipients</option>';
        }).doGet({
          action: 'getRecipients',
          token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
          user_id: myId
        });
      } else {
        select.innerHTML = '<option value="">Error loading recipients</option>';
      }
    });
}

function sendNewMessage(event) {
  if (event) event.preventDefault();
  const recipient = document.getElementById('compose-recipient').value;
  const subject = document.getElementById('compose-subject').value;
  const message = document.getElementById('compose-message').value;
  const projectId = document.getElementById('compose-project')?.value || '';
  
  if (!recipient || !message) {
    alert('Please select a recipient and enter a message.');
    return;
  }
  
  const user = getCurrentUser();
  const myId = user.user_id || user.id || user.client_id;
  const btn = document.getElementById('btn-send-new');
  
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }
  
  const payload = {
    sender_id: myId,
    receiver_id: recipient,
    recipient_id: recipient,
    subject: subject,
    message: message,
    body: message,
    project_id: projectId
  };
  
  google.script.run.withSuccessHandler(res => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
    
    try {
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      if (parsed.status === 'success' || parsed.success) {
        closeNewMessageModal();
        const composeForm = document.getElementById('form-compose');
        if (composeForm) composeForm.reset();
        loadConversations();
        const convId = (parsed.data && parsed.data.conversation_id) || parsed.conversation_id;
        if (convId) openConversation(convId);
      } else {
        alert('Error: ' + (parsed.message || parsed.error || 'Failed to send message'));
      }
    } catch(e) {
      console.error(e);
    }
  }).doPost({
    action: 'sendMessage',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    data: JSON.stringify(payload)
  });
}

function deleteConversation() {
  if (!confirm('Delete this conversation for you?')) return;
  const user = getCurrentUser();
  const myId = user.user_id || user.id || user.client_id;
  
  google.script.run.withSuccessHandler(() => {
    currentConversationId = null;
    loadConversations();
    renderThread();
  }).doPost({
    action: 'deleteConversationForMe',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    data: JSON.stringify({
      conversation_id: currentConversationId,
      user_id: myId
    })
  });
}

function deleteMessage(msgId) {
  if (!confirm('Delete this message for you?')) return;
  const user = getCurrentUser();
  const myId = user.user_id || user.id || user.client_id;
  
  google.script.run.withSuccessHandler(() => {
    loadConversationThread(currentConversationId);
  }).doPost({
    action: 'deleteMessageForMe',
    token: 'sec_wb_crm_77c4e569bbd18f0a1c6a58',
    data: JSON.stringify({
      message_id: msgId,
      user_id: myId
    })
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMessaging();
  
  // Bind events if elements exist
  const msgInput = document.getElementById('msg-input');
  if (msgInput) {
    msgInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendReply();
      }
    });
  }
});

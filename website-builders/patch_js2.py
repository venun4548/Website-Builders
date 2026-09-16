import re

def update_file():
    path = r"c:\Users\venun\Desktop\Website-Builders\website-builders\js\messages.js"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. initMessaging check
    content = content.replace("if (typeof google !== 'undefined' && google.script && google.script.run) {", "if (true) { // Polyfilled")
    
    # 2. Add Polyfill at the top of the file
    polyfill = """
// Polyfill for google.script.run using fetch to Python Backend
if (typeof google === 'undefined' || !google.script || !google.script.run) {
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = {
    withSuccessHandler: function(successCb) {
      const runner = {
        withFailureHandler: function(failureCb) {
          runner.failureCb = failureCb;
          return runner;
        },
        doGet: function(payload) {
          const action = payload.action;
          let url = '/api/messages'; // default fallback
          
          if (action === 'getStats') url = '/api/stats/admin'; // just dummy or implement later
          if (action === 'getConversations') url = '/api/messages/conversations';
          if (action === 'getConversationThread') url = '/api/messages/conversations/' + payload.conversation_id;
          if (action === 'getRecipients') url = '/api/messages/recipients';
          
          fetch(url)
            .then(r => r.json())
            .then(res => {
              // The python backend already parsed the JSON from GAS.
              // But our JS expects a JSON string because google.script.run returned stringified JSON.
              successCb(JSON.stringify(res));
            })
            .catch(e => {
              if(runner.failureCb) runner.failureCb(e);
              else console.error(e);
            });
        },
        doPost: function(payload) {
          const action = payload.action;
          let url = '/api/messages';
          let reqData = payload;
          let method = 'POST';
          
          if (action === 'sendMessage') {
            url = '/api/messages';
            reqData = JSON.parse(payload.data);
          } else if (action === 'markMessageRead') {
            url = '/api/messages/' + payload.message_id + '/read';
            reqData = {};
          }
          
          fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(reqData)
          })
          .then(r => r.json())
          .then(res => {
             // Python returns something like {success: true} or {status: 'success', data: ...}
             // Let's normalize it so successCb gets stringified JSON
             if (res.success) res.status = 'success';
             successCb(JSON.stringify(res));
          })
          .catch(e => {
            if(runner.failureCb) runner.failureCb(e);
            else console.error(e);
          });
        }
      };
      return runner;
    }
  };
}
"""
    if "Polyfill for google.script.run" not in content:
        content = polyfill + content
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Polyfill applied!")

update_file()

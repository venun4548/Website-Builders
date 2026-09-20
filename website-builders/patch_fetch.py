import re

js_path = r"c:\Users\venun\Desktop\Website-Builders\website-builders\js\messages.js"

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace google.script.run calls with fetch calls

# 1. getStats
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.withFailureHandler[^;]+;\s*}\)\.doGet\({[^}]*action:\s*'getStats'[^}]*}\);",
    r"fetch('/api/stats/admin').then(r=>r.json()).then(parsed => {\1}).catch(e => console.error('Stats error:', e));",
    js
)
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.doGet\({[^}]*action:\s*'getStats'[^}]*}\);",
    r"fetch('/api/stats/admin').then(r=>r.json()).then(parsed => {\1}).catch(e => console.error('Stats error:', e));",
    js
)

# 2. getConversations
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.doGet\({[^}]*action:\s*'getConversations'[^}]*}\);",
    r"fetch('/api/messages/conversations').then(r=>r.text()).then(res => {\1}).catch(e => console.error('Conversations error:', e));",
    js
)

# 3. getConversationThread
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.doGet\({[^}]*action:\s*'getConversationThread'[^}]*}\);",
    r"fetch(`/api/messages/conversations/${convId}`).then(r=>r.text()).then(res => {\1}).catch(e => console.error('Thread error:', e));",
    js
)

# 4. getRecipients
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.withFailureHandler\([^)]+\)\s*\{\s*console\.error\([^)]+\);\s*select\.innerHTML = [^;]+;\s*\}\)\.doGet\({[^}]*action:\s*'getRecipients'[^}]*}\);",
    r"fetch('/api/messages/recipients').then(r=>r.text()).then(res => {\1}).catch(e => { console.error('Recipients error:', e); select.innerHTML = '<option value=\"\">Failed to fetch</option>'; });",
    js
)
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.doGet\({[^}]*action:\s*'getRecipients'[^}]*}\);",
    r"fetch('/api/messages/recipients').then(r=>r.text()).then(res => {\1}).catch(e => { console.error('Recipients error:', e); select.innerHTML = '<option value=\"\">Failed to fetch</option>'; });",
    js
)

# 5. sendMessage (sendReply)
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(res => {([\s\S]*?)}\)\.doPost\({[^}]*action:\s*'sendMessage',[^}]*data:\s*JSON\.stringify\(payload\)[^}]*}\);",
    r"fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r=>r.text()).then(res => {\1}).catch(e => console.error('Send error:', e));",
    js
)

# 6. deleteMessageForMe
js = re.sub(
    r"google\.script\.run\.withSuccessHandler\(\(\) => {([\s\S]*?)}\)\.doPost\({[^}]*action:\s*'deleteMessageForMe'[^}]*}\);",
    r"fetch('/api/messages/' + msgId + '/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(() => {\1}).catch(e => console.error('Delete error:', e));",
    js
)

# 7. initMessaging Check
js = js.replace(
    "if (typeof google !== 'undefined' && google.script && google.script.run) {",
    "if (true) {"
)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("messages.js patched to use fetch() instead of google.script.run")

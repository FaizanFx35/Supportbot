const { getConfig, saveConfig } = require('./config');

const TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function auth(req) {
  return Boolean(
    ADMIN_SECRET &&
    req.headers &&
    req.headers['x-admin-secret'] === ADMIN_SECRET
  );
}

async function telegram(method, body) {
  if (!TOKEN) throw new Error('BOT_TOKEN is missing');

  const response = await fetch(
    `https://api.telegram.org/bot${TOKEN}/${method}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body || {})
    }
  );

  return await response.json();
}

const DEFAULT_COMMANDS = [
  {
    command: 'start',
    description: 'Install the Official App and Follow Our Signals',
    text: '👋 Welcome to Fx Signal Lab!\n\n📲 Download our official app, access Forex Signals, and explore our latest apps and services.\n\nChoose an option below 👇',
    buttons: [
      { text: '⭐ Official App', url: 'https://play.google.com/store/apps/details?id=co.median.android.eezlxez' },
      { text: '📊 Forex Signals App', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' },
      { text: '💼 Exness Broker', url: 'https://one.exnessonelink.com/a/vtkbbmje' },
      { text: '📱 All Fx Signal Lab Apps', url: 'https://play.google.com/store/apps/developer?id=Fx+Signal+Lab' }
    ]
  },
  {
    command: 'download',
    description: 'Download Our Apps',
    text: '📲 Fx Signal Lab Apps\n\nChoose what you need below 👇',
    buttons: [
      { text: '⭐ Official App', url: 'https://play.google.com/store/apps/details?id=co.median.android.eezlxez' },
      { text: '📊 Forex Signals App', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' },
      { text: '💼 Exness Broker', url: 'https://one.exnessonelink.com/a/vtkbbmje' },
      { text: '📱 All Fx Signal Lab Apps', url: 'https://play.google.com/store/apps/developer?id=Fx+Signal+Lab' }
    ]
  },
  {
    command: 'signals',
    description: 'Get the Latest Trading Signals',
    text: '📊 Latest Trading Signals\n\nGet our latest Forex trading signals, including Entry, Stop Loss and Take Profit levels.\n\nTap below to open the Forex Signals App 👇',
    buttons: [
      { text: '📲 Open Forex Signals App', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' }
    ]
  },
  {
    command: 'gold',
    description: 'Get the Latest Gold XAUUSD Signals',
    text: '🥇 Gold XAUUSD Signals\n\nGet the latest Gold trading signals with Entry, Stop Loss and Take Profit levels.\n\nOpen the Forex Signals App to view the latest Gold signals 👇',
    buttons: [
      { text: '🥇 Open Gold Signals', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' }
    ]
  },
  {
    command: 'forex',
    description: 'Get Forex Trading Signals',
    text: '📊 Forex Trading Signals\n\nAccess our latest Forex signals with Entry, Stop Loss and Take Profit levels.\n\nTap below to open the Forex Signals App 👇',
    buttons: [
      { text: '📲 Open Forex Signals App', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' }
    ]
  },
  {
    command: 'crypto',
    description: 'Get Crypto Trading Signals',
    text: '₿ Crypto Trading Signals\n\nAccess our latest Crypto trading signals and market updates.\n\nTap below to open the Forex Signals App 👇',
    buttons: [
      { text: '📲 Open Signals App', url: 'https://play.google.com/store/apps/details?id=co.median.android.odrkwln' }
    ]
  },
  {
    command: 'broker',
    description: 'Open Exness Broker Account',
    text: '💼 Exness Broker\n\nOpen an Exness account through our official partner link.\n\n👇 Continue to Exness:',
    buttons: [
      { text: '🚀 Open Exness Account', url: 'https://one.exnessonelink.com/a/vtkbbmje' }
    ]
  },
  {
    command: 'apps',
    description: 'View All Fx Signal Lab Apps',
    text: '📱 Explore all Fx Signal Lab Apps.\n\nChoose from our official apps and trading tools 👇',
    buttons: [
      { text: '🔎 View All Apps', url: 'https://play.google.com/store/apps/developer?id=Fx+Signal+Lab' }
    ]
  },
  {
    command: 'support',
    description: 'Contact Our Support Team',
    text: '🆘 Fx Signal Lab Support\n\nNeed help with our apps, signals or services?\n\nContact our support team below 👇',
    buttons: [
      { text: '💬 Contact Support', url: 'https://t.me/forexqueeni' }
    ]
  },
  {
    command: 'channel',
    description: 'Join Our Official Telegram Channel',
    text: '📢 Official Telegram Channel\n\nGet the latest trading signals, market updates, announcements and important updates from Fx Signal Lab.\n\n👇 Join our official channel:',
    buttons: [
      { text: '📢 Join Official Channel', url: 'https://t.me/livesignals_trading' }
    ]
  },
  {
    command: 'group',
    description: 'Join Our Official Telegram Group',
    text: '👥 Official Telegram Group\n\nJoin our community to stay connected with other traders and receive updates from Fx Signal Lab.\n\n👇 Join the group:',
    buttons: [
      { text: '👥 Join Official Group', url: 'https://t.me/livesignals_tradings' }
    ]
  },
  {
    command: 'exness',
    description: 'Open Exness Broker Account',
    text: '💼 Exness Broker\n\nOpen your Exness account through our official partner link.\n\n👇 Continue to Exness:',
    buttons: [
      { text: '🚀 Open Exness Account', url: 'https://one.exnessonelink.com/a/vtkbbmje' }
    ]
  },
  {
    command: 'xm',
    description: 'Open XM Broker Account',
    text: '💼 XM Broker\n\nAccess the broker registration link below.\n\n👇 Continue:',
    buttons: [
      { text: '🚀 Open XM Account', url: 'https://trendo.com/invite?market=googleplay&code=3317391' }
    ]
  },
  {
    command: 'trendo',
    description: 'Open Trendo Market Broker Account',
    text: '💼 Trendo Market\n\nOpen Trendo Market using the link below.\n\n👇 Register / Open Trendo:',
    buttons: [
      { text: '🚀 Open Trendo Market', url: 'https://trendo.com/invite?market=googleplay&code=3317391' }
    ]
  }
];

function mergeDefaultCommands(config) {
  if (!config || typeof config !== 'object') {
    config = {};
  }
  if (!Array.isArray(config.commands)) {
    config.commands = [];
  }

  const existing = new Set(
    config.commands
      .map(item => String(item?.command || '').replace(/^\//, '').trim())
      .filter(Boolean)
  );

  DEFAULT_COMMANDS.forEach(defaultCommand => {
    if (!existing.has(defaultCommand.command)) {
      config.commands.push(
        JSON.parse(JSON.stringify(defaultCommand))
      );
    }
  });

  return config;
}

const page = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Queen i Support Admin</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7fb;color:#172033;margin:0}
.wrap{max-width:900px;margin:auto;padding:20px}
.card{background:#fff;border:1px solid #e5e9f2;border-radius:16px;padding:18px;margin:14px 0;box-shadow:0 3px 14px #00000008}
h1{margin:0 0 5px}
small{color:#667085}
input,textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #d9deea;border-radius:10px;margin:6px 0 12px;font:inherit}
textarea{min-height:110px}
.row{display:flex;gap:10px;flex-wrap:wrap}
.row>*{flex:1;min-width:160px}
button{border:0;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer}
.primary{background:#2563eb;color:#fff}
.muted{background:#eef2f7}
.danger{background:#fee2e2;color:#991b1b}
.cmd{border:1px solid #e4e8f0;border-radius:12px;padding:14px;margin:10px 0}
.btn{background:#f8fafc;padding:10px;border-radius:10px;margin:6px 0;border:1px solid #e5e7eb}
.status{padding:10px;border-radius:10px;background:#eef6ff;margin:10px 0;white-space:pre-wrap}
.hidden{display:none}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.pill{background:#eaf2ff;color:#1d4ed8;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700}
</style>
</head>
<body>
<div class="wrap">
<div class="top">
<div>
<h1>🤖 Queen i Support</h1>
<small>Private Telegram Bot Admin Panel</small>
</div>
<span class="pill">Self-hosted</span>
</div>

<div id="login" class="card">
<h3>Admin Login</h3>
<input id="secret" type="password" placeholder="ADMIN_SECRET">
<button class="primary" onclick="login()">Open Panel</button>
</div>

<div id="panel" class="hidden">
<div class="card">
<div class="top">
<h2>Commands</h2>
<button class="primary" onclick="addCmd()">+ Add Command</button>
</div>
<div id="list"></div>
<div class="row">
<button class="primary" onclick="saveAll()">💾 Save to GitHub</button>
<button class="muted" onclick="syncTelegram()">🔄 Sync Telegram Menu</button>
<button class="muted" onclick="setupWebhook()">⚙️ Setup Webhook</button>
</div>
<div id="status" class="status">Ready.</div>
</div>
</div>
</div>

<script>
let secret = '';
let config = { commands:[] };

function login(){
  secret = document.getElementById('secret').value.trim();
  if(!secret) return;
  localStorage.setItem('queen_admin', secret);
  load();
}

async function api(action,body){
  const response = await fetch('/api/admin', {
    method:'POST',
    headers:{
      'content-type':'application/json',
      'x-admin-secret':secret
    },
    body:JSON.stringify(Object.assign({action:action}, body || {}))
  });

  let data;
  try{
    data = await response.json();
  }catch(e){
    throw new Error('Server returned an invalid response. Check Vercel logs.');
  }

  if(!response.ok || !data.ok){
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
}

async function load(){
  try{
    secret = secret || localStorage.getItem('queen_admin') || '';
    if(!secret) return;

    const data = await api('get');
    config = data.config || {commands:[]};
    if(!Array.isArray(config.commands)){
      config.commands = [];
    }

    document.getElementById('login').classList.add('hidden');
    document.getElementById('panel').classList.remove('hidden');
    render();
  }catch(error){
    document.getElementById('status').textContent = error.message;
  }
}

function render(){
  const list = document.getElementById('list');
  list.innerHTML = '';

  (config.commands || []).forEach(function(command,index){
    const card = document.createElement('div');
    card.className = 'cmd';
    card.innerHTML =
      '<div class="row">' +
        '<div>' +
          '<b>/</b>' +
          '<input value="' + esc(command.command) + '" data-command-index="' + index + '" data-field="command">' +
        '</div>' +
        '<div>' +
          '<input value="' + esc(command.description) + '" data-command-index="' + index + '" data-field="description" placeholder="Bot menu description">' +
        '</div>' +
      '</div>' +
      '<textarea data-command-index="' + index + '" data-field="text" placeholder="Reply text">' + esc(command.text) + '</textarea>' +
      '<div><b>Buttons</b></div>' +
      '<div id="buttons-' + index + '"></div>' +
      '<button class="muted" onclick="addButton(' + index + ')">+ Button</button> ' +
      '<button class="danger" onclick="deleteCommand(' + index + ')">Delete Command</button>';
    list.appendChild(card);
    renderButtons(index);
  });
}

function renderButtons(commandIndex){
  const box = document.getElementById('buttons-' + commandIndex);
  if(!box) return;
  box.innerHTML = '';
  const buttons = config.commands[commandIndex].buttons || [];

  buttons.forEach(function(button,buttonIndex){
    const div = document.createElement('div');
    div.className = 'btn';
    div.innerHTML =
      '<input value="' + esc(button.text) + '" data-button-command="' + commandIndex + '" data-button-index="' + buttonIndex + '" data-button-field="text" placeholder="Button text">' +
      '<input value="' + esc(button.url) + '" data-button-command="' + commandIndex + '" data-button-index="' + buttonIndex + '" data-button-field="url" placeholder="https://...">' +
      '<button class="danger" onclick="deleteButton(' + commandIndex + ',' + buttonIndex + ')">Remove</button>';
    box.appendChild(div);
  });
}

function syncFields(){
  document.querySelectorAll('[data-command-index]').forEach(function(element){
    const index = Number(element.dataset.commandIndex);
    const field = element.dataset.field;
    if(config.commands[index]){
      config.commands[index][field] = element.value;
    }
  });

  document.querySelectorAll('[data-button-command]').forEach(function(element){
    const commandIndex = Number(element.dataset.buttonCommand);
    const buttonIndex = Number(element.dataset.buttonIndex);
    const field = element.dataset.buttonField;
    if(config.commands[commandIndex] && Array.isArray(config.commands[commandIndex].buttons) && config.commands[commandIndex].buttons[buttonIndex]){
      config.commands[commandIndex].buttons[buttonIndex][field] = element.value;
    }
  });
}

function addCmd(){
  syncFields();
  config.commands.push({
    command: 'newcommand' + Date.now().toString().slice(-5),
    description: 'New command',
    text: 'Your message here',
    buttons: []
  });
  render();
  showStatus('New command added. Edit it and click 💾 Save to GitHub.');
}

function deleteCommand(index){
  syncFields();
  if(!confirm('Delete this command?')) return;
  config.commands.splice(index,1);
  render();
}

function addButton(commandIndex){
  syncFields();
  if(!Array.isArray(config.commands[commandIndex].buttons)){
    config.commands[commandIndex].buttons = [];
  }
  config.commands[commandIndex].buttons.push({
    text: 'Button',
    url: 'https://'
  });
  render();
}

function deleteButton(commandIndex,buttonIndex){
  syncFields();
  config.commands[commandIndex].buttons.splice(buttonIndex, 1);
  render();
}

async function saveAll(){
  try{
    syncFields();
    const data = await api('save', { config: config });
    showStatus(data.message || 'Saved.');
  }catch(error){
    showStatus(error.message);
  }
}

async function syncTelegram(){
  try{
    syncFields();
    const data = await api('sync');
    showStatus(data.message || 'Telegram menu synced.');
  }catch(error){
    showStatus(error.message);
  }
}

async function setupWebhook(){
  try{
    const data = await api('setup');
    showStatus(data.message || 'Webhook connected.');
  }catch(error){
    showStatus(error.message);
  }
}

function showStatus(message){
  document.getElementById('status').textContent = message;
}

if(localStorage.getItem('queen_admin')){
  secret = localStorage.getItem('queen_admin');
  load();
}
</script>
</body>
</html>`;

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res
      .status(200)
      .setHeader('content-type', 'text/html; charset=utf-8')
      .send(page);
  }

ss  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  if (!auth(req)) {
    return res.status(401).json({ ok: false, error: 'Wrong ADMIN_SECRET' });
  }

  try {
    const action = req.body && req.body.action;

    if (action === 'get') {
      let current = await getConfig();
      current = mergeDefaultCommands(current);
      return res.status(200).json({ ok: true, config: current });
    }

    if (action === 'save') {
      if (!req.body.config || !Array.isArray(req.body.config.commands)) {
        return res.status(400).json({ ok: false, error: 'Invalid config' });
      }

      const finalConfig = mergeDefaultCommands(req.body.config);
      await saveConfig(finalConfig);
      return res.status(200).json({ ok: true, message: 'Saved to GitHub. Vercel will redeploy automatically.' });
    }

    if (action === 'sync') {
      const current = mergeDefaultCommands(await getConfig());
      const commands = (current.commands || [])
        .filter(item => item && item.command)
        .map(item => ({
          command: String(item.command).replace(/^\//, '').trim(),
          description: String(item.description || '').slice(0, 256)
        }))
        .filter(item => /^[a-z0-9_]{1,32}$/.test(item.command));

      const result = await telegram('setMyCommands', { commands });

      if (!result.ok) {
        return res.status(500).json({
          ok: false,
          error: result.description || JSON.stringify(result)
        });
      }

      return res.status(200).json({ ok: true, message: 'Telegram command menu synced.' });
    }

    if (action === 'setup') {
      const host = req.headers.host;
      const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];

      if (!host) {
        return res.status(500).json({ ok: false, error: 'Host header is missing' });
      }

      const webhookUrl = proto + '://' + host + '/api/webhook';
      const payload = { url: webhookUrl };

      if (process.env.WEBHOOK_SECRET) {
        payload.secret_token = process.env.WEBHOOK_SECRET;
      }

      const result = await telegram('setWebhook', payload);

      if (!result.ok) {
        return res.status(500).json({
          ok: false,
          error: result.description || JSON.stringify(result)
        });
      }

      return res.status(700 || 200).json({ ok: true, message: 'Webhook connected: ' + webhookUrl });
    }

    return res.status(400).json({
      ok: false,
      error: 'Unknown action'
    });

  } catch (error) {
    console.error('ADMIN ERROR:', error);
    return res.status(500).json({
      ok: false,
      error: error && error.message ? error.message : 'Internal server error'
    });
  }
};

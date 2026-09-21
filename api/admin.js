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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    }
  );

  return await response.json();
}

const page = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Queen i Support Admin</title>

<style>
body{
  font-family:system-ui,-apple-system,sans-serif;
  background:#f5f7fb;
  color:#172033;
  margin:0
}

.wrap{
  max-width:900px;
  margin:auto;
  padding:20px
}

.card{
  background:#fff;
  border:1px solid #e5e9f2;
  border-radius:16px;
  padding:18px;
  margin:14px 0;
  box-shadow:0 3px 14px #00000008
}

h1{
  margin:0 0 5px
}

small{
  color:#667085
}

input,
textarea{
  width:100%;
  box-sizing:border-box;
  padding:11px;
  border:1px solid #d9deea;
  border-radius:10px;
  margin:6px 0 12px;
  font:inherit
}

textarea{
  min-height:110px
}

.row{
  display:flex;
  gap:10px;
  flex-wrap:wrap
}

.row>*{
  flex:1;
  min-width:160px
}

button{
  border:0;
  border-radius:10px;
  padding:11px 16px;
  font-weight:700;
  cursor:pointer
}

.primary{
  background:#2563eb;
  color:#fff
}

.muted{
  background:#eef2f7
}

.danger{
  background:#fee2e2;
  color:#991b1b
}

.cmd{
  border:1px solid #e4e8f0;
  border-radius:12px;
  padding:14px;
  margin:10px 0
}

.btn{
  background:#f8fafc;
  padding:10px;
  border-radius:10px;
  margin:6px 0;
  border:1px solid #e5e7eb
}

.status{
  padding:10px;
  border-radius:10px;
  background:#eef6ff;
  margin:10px 0;
  white-space:pre-wrap
}

.hidden{
  display:none
}

.top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px
}

.pill{
  background:#eaf2ff;
  color:#1d4ed8;
  padding:5px 9px;
  border-radius:999px;
  font-size:12px;
  font-weight:700
}
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

  <input
    id="secret"
    type="password"
    placeholder="ADMIN_SECRET"
  >

  <button class="primary" onclick="login()">
    Open Panel
  </button>

</div>

<div id="panel" class="hidden">

  <div class="card">

    <div class="top">

      <h2>Commands</h2>

      <button class="primary" onclick="addCmd()">
        + Add Command
      </button>

    </div>

    <div id="list"></div>

    <div class="row">

      <button class="primary" onclick="saveAll()">
        💾 Save to GitHub
      </button>

      <button class="muted" onclick="syncTelegram()">
        🔄 Sync Telegram Menu
      </button>

      <button class="muted" onclick="setupWebhook()">
        ⚙️ Setup Webhook
      </button>

    </div>

    <div id="status" class="status">
      Ready.
    </div>

  </div>

</div>

</div>

<script>

let secret = '';
let config = {
  commands: []
};

function login() {

  secret =
    document
      .getElementById('secret')
      .value
      .trim();

  if (!secret) return;

  localStorage.setItem(
    'queen_admin',
    secret
  );

  load();
}

async function api(action, body) {

  const response = await fetch(
    '/api/admin',
    {
      method:'POST',

      headers:{
        'content-type':'application/json',
        'x-admin-secret':secret
      },

      body:JSON.stringify(
        Object.assign(
          { action:action },
          body || {}
        )
      )
    }
  );

  let data;

  try {

    data = await response.json();

  } catch(e) {

    throw new Error(
      'Server returned an invalid response. Check Vercel logs.'
    );

  }

  if (!response.ok || !data.ok) {

    throw new Error(
      data.error ||
      data.message ||
      'Request failed'
    );

  }

  return data;
}

async function load() {

  try {

    secret =
      secret ||
      localStorage.getItem('queen_admin') ||
      '';

    if (!secret) return;

    const data =
      await api('get');

    config =
      data.config ||
      { commands:[] };

    if (!Array.isArray(config.commands)) {
      config.commands = [];
    }

    document
      .getElementById('login')
      .classList
      .add('hidden');

    document
      .getElementById('panel')
      .classList
      .remove('hidden');

    render();

  } catch(error) {

    document
      .getElementById('status')
      .textContent =
      error.message;

  }

}

function render() {

  const list =
    document.getElementById('list');

  list.innerHTML = '';

  (config.commands || [])
    .forEach(function(command,index){

      const card =
        document.createElement('div');

      card.className = 'cmd';

      card.innerHTML =

        '<div class="row">' +

          '<div>' +

            '<b>/</b>' +

            '<input ' +
              'value="' +
              esc(command.command) +
              '" ' +
              'data-command-index="' +
              index +
              '" ' +
              'data-field="command">' +

          '</div>' +

          '<div>' +

            '<input ' +
              'value="' +
              esc(command.description) +
              '" ' +
              'data-command-index="' +
              index +
              '" ' +
              'data-field="description" ' +
              'placeholder="Bot menu description">' +

          '</div>' +

        '</div>' +

        '<textarea ' +
          'data-command-index="' +
          index +
          '" ' +
          'data-field="text" ' +
          'placeholder="Reply text">' +

          esc(command.text) +

        '</textarea>' +

        '<div><b>Buttons</b></div>' +

        '<div id="buttons-' +
          index +
          '"></div>' +

        '<button class="muted" ' +
          'onclick="addButton(' +
          index +
          ')">' +

          '+ Button' +

        '</button> ' +

        '<button class="danger" ' +
          'onclick="deleteCommand(' +
          index +
          ')">' +

          'Delete Command' +

        '</button>';

      list.appendChild(card);

      renderButtons(index);

    });

}

function renderButtons(commandIndex) {

  const box =
    document.getElementById(
      'buttons-' + commandIndex
    );

  if (!box) return;

  box.innerHTML = '';

  const buttons =
    config.commands[commandIndex].buttons || [];

  buttons.forEach(
    function(button,buttonIndex){

      const div =
        document.createElement('div');

      div.className = 'btn';

      div.innerHTML =

        '<input ' +
          'value="' +
          esc(button.text) +
          '" ' +
          'data-button-command="' +
          commandIndex +
          '" ' +
          'data-button-index="' +
          buttonIndex +
          '" ' +
          'data-button-field="text" ' +
          'placeholder="Button text">' +

        '<input ' +
          'value="' +
          esc(button.url) +
          '" ' +
          'data-button-command="' +
          commandIndex +
          '" ' +
          'data-button-index="' +
          buttonIndex +
          '" ' +
          'data-button-field="url" ' +
          'placeholder="https://...">' +

        '<button class="danger" ' +
          'onclick="deleteButton(' +
          commandIndex +
          ',' +
          buttonIndex +
          ')">' +

          'Remove' +

        '</button>';

      box.appendChild(div);

    }
  );

}

function syncFields() {

  document
    .querySelectorAll('[data-command-index]')
    .forEach(function(element){

      const index =
        Number(
          element.dataset.commandIndex
        );

      const field =
        element.dataset.field;

      if (config.commands[index]) {

        config.commands[index][field] =
          element.value;

      }

    });

  document
    .querySelectorAll('[data-button-command]')
    .forEach(function(element){

      const commandIndex =
        Number(
          element.dataset.buttonCommand
        );

      const buttonIndex =
        Number(
          element.dataset.buttonIndex
        );

      const field =
        element.dataset.buttonField;

      if (
        config.commands[commandIndex] &&
        Array.isArray(
          config.commands[commandIndex].buttons
        ) &&
        config.commands[commandIndex]
          .buttons[buttonIndex]
      ) {

        config.commands[commandIndex]
          .buttons[buttonIndex][field] =
          element.value;

      }

    });

}

function addCmd() {

  syncFields();

  config.commands.push({

    command:'newcommand',

    description:'New command',

    text:'Your message here',

    buttons:[]

  });

  render();

}

function deleteCommand(index) {

  syncFields();

  config.commands.splice(index,1);

  render();

}

function addButton(commandIndex) {

  syncFields();

  if (
    !Array.isArray(
      config.commands[commandIndex].buttons
    )
  ) {

    config.commands[commandIndex].buttons = [];

  }

  config.commands[commandIndex]
    .buttons
    .push({

      text:'Button',

      url:'https://'

    });

  render();

}

function deleteButton(
  commandIndex,
  buttonIndex
) {

  syncFields();

  config.commands[commandIndex]
    .buttons
    .splice(buttonIndex,1);

  render();

}

async function saveAll() {

  try {

    syncFields();

    const data =
      await api(
        'save',
        {
          config:config
        }
      );

    showStatus(
      data.message ||
      'Saved.'
    );

  } catch(error) {

    showStatus(
      error.message
    );

  }

}

async function syncTelegram() {

  try {

    syncFields();

    const data =
      await api('sync');

    showStatus(
      data.message ||
      'Telegram menu synced.'
    );

  } catch(error) {

    showStatus(
      error.message
    );

  }

}

async function setupWebhook() {

  try {

    const data =
      await api('setup');

    showStatus(
      data.message ||
      'Webhook connected.'
    );

  } catch(error) {

    showStatus(
      error.message
    );

  }

}

function showStatus(message) {

  document
    .getElementById('status')
    .textContent =
    message;

}

if (
  localStorage.getItem('queen_admin')
) {

  secret =
    localStorage.getItem(
      'queen_admin'
    );

  load();

}

</script>

</body>
</html>`;

module.exports = async (req,res) => {

  if (req.method === 'GET') {

    return res
      .status(200)
      .setHeader(
        'content-type',
        'text/html; charset=utf-8'
      )
      .send(page);

  }

  if (req.method !== 'POST') {

    return res.status(405).json({

      ok:false,

      error:'POST only'

    });

  }

  if (!auth(req)) {

    return res.status(401).json({

      ok:false,

      error:'Wrong ADMIN_SECRET'

    });

  }

  try {

    const action =
      req.body &&
      req.body.action;

    if (action === 'get') {

      return res.status(200).json({

        ok:true,

        config:
          await getConfig()

      });

    }

    if (action === 'save') {

      if (
        !req.body.config ||
        !Array.isArray(
          req.body.config.commands
        )
      ) {

        return res.status(400).json({

          ok:false,

          error:'Invalid config'

        });

      }

      await saveConfig(
        req.body.config
      );

      return res.status(200).json({

        ok:true,

        message:
          'Saved to GitHub. Vercel will redeploy automatically.'

      });

    }

    if (action === 'sync') {

      const current =
        await getConfig();

      const commands =
        (current.commands || [])

          .filter(function(item){

            return item &&
              item.command;

          })

          .map(function(item){

            return {

              command:
                String(item.command)
                  .replace(/^\//,'')
                  .trim(),

              description:
                String(
                  item.description || ''
                ).slice(0,256)

            };

          })

          .filter(function(item){

            return /^[a-z0-9_]{1,32}$/
              .test(item.command);

          });

      const result =
        await telegram(
          'setMyCommands',
          {
            commands:commands
          }
        );

      if (!result.ok) {

        return res.status(500).json({

          ok:false,

          error:
            result.description ||
            JSON.stringify(result)

        });

      }

      return res.status(200).json({

        ok:true,

        message:
          'Telegram command menu synced.'

      });

    }

    if (action === 'setup') {

      const host =
        req.headers.host;

      const proto =
        String(
          req.headers['x-forwarded-proto'] ||
          'https'
        ).split(',')[0];

      if (!host) {

        return res.status(500).json({

          ok:false,

          error:'Host header is missing'

        });

      }

      const webhookUrl =
        proto +
        '://' +
        host +
        '/api/webhook';

      const payload = {
        url:webhookUrl
      };

      if (process.env.WEBHOOK_SECRET) {

        payload.secret_token =
          process.env.WEBHOOK_SECRET;

      }

      const result =
        await telegram(
          'setWebhook',
          payload
        );

      if (!result.ok) {

        return res.status(500).json({

          ok:false,

          error:
            result.description ||
            JSON.stringify(result)

        });

      }

      return res.status(200).json({

        ok:true,

        message:
          'Webhook connected: ' +
          webhookUrl

      });

    }

    return res.status(400).json({

      ok:false,

      error:'Unknown action'

    });

  } catch(error) {

    console.error(
      'ADMIN ERROR:',
      error
    );

    return res.status(500).json({

      ok:false,

      error:
        error && error.message
          ? error.message
          : 'Internal server error'

    });

  }

};

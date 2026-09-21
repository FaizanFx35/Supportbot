const { getConfig, saveConfig } = require('./config');

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function esc(s) {
  return String(s ?? '')
    .replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));
}

function auth(req) {
  return ADMIN_SECRET && req.headers['x-admin-secret'] === ADMIN_SECRET;
}

async function tg(method, body) {
  const r = await fetch(
    `https://api.telegram.org/bot${TOKEN}/${method}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  return r.json();
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
  background:white;
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
  background:#eef2f7;
  color:#172033
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

    <button
      id="loginBtn"
      type="button"
      class="primary"
    >
      Open Panel
    </button>
  </div>

  <div id="panel" class="hidden">

    <div class="card">

      <div class="top">
        <h2>Commands</h2>

        <button
          id="addCommandBtn"
          type="button"
          class="primary"
        >
          + Add Command
        </button>
      </div>

      <div id="list"></div>

      <div class="row">

        <button
          id="saveBtn"
          type="button"
          class="primary"
        >
          💾 Save to GitHub
        </button>

        <button
          id="syncBtn"
          type="button"
          class="muted"
        >
          🔄 Sync Telegram Menu
        </button>

        <button
          id="setupBtn"
          type="button"
          class="muted"
        >
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


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(s) {

  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

}


/* =========================
   STATUS
========================= */

function showStatus(message) {

  const el = document.getElementById('status');

  if (el) {
    el.textContent = message;
  }

}


/* =========================
   LOGIN
========================= */

async function login() {

  const input = document.getElementById('secret');

  secret = input ? input.value.trim() : '';

  if (!secret) {

    showStatus('Please enter ADMIN_SECRET.');

    return;
  }

  localStorage.setItem(
    'queen_admin',
    secret
  );

  await load();

}


/* =========================
   API
========================= */

async function api(action, body = {}) {

  const response = await fetch(
    '/api/admin',
    {
      method: 'POST',

      headers: {
        'content-type': 'application/json',
        'x-admin-secret': secret
      },

      body: JSON.stringify({
        action,
        ...body
      })
    }
  );

  let result;

  try {

    result = await response.json();

  } catch {

    throw new Error(
      'Invalid server response.'
    );

  }

  if (!response.ok || !result.ok) {

    throw new Error(
      result.error || 'Request failed.'
    );

  }

  return result;

}


/* =========================
   LOAD CONFIG
========================= */

async function load() {

  try {

    secret =
      secret ||
      localStorage.getItem('queen_admin') ||
      '';

    if (!secret) {

      return;

    }

    const result = await api('get');

    config =
      result.config ||
      {
        commands: []
      };

    document
      .getElementById('login')
      .classList
      .add('hidden');

    document
      .getElementById('panel')
      .classList
      .remove('hidden');

    render();

    showStatus(
      'Admin panel loaded.'
    );

  } catch (error) {

    showStatus(
      error.message
    );

  }

}


/* =========================
   RENDER COMMANDS
========================= */

function render() {

  const list =
    document.getElementById('list');

  if (!list) return;

  list.innerHTML = '';

  const commands =
    config.commands || [];

  commands.forEach(
    (command, index) => {

      const wrapper =
        document.createElement('div');

      wrapper.className = 'cmd';

      wrapper.innerHTML = `

        <div class="row">

          <div>

            <b>/</b>

            <input
              value="${escapeHtml(command.command)}"
              data-i="${index}"
              data-k="command"
              placeholder="command"
            >

          </div>

          <div>

            <input
              value="${escapeHtml(command.description)}"
              data-i="${index}"
              data-k="description"
              placeholder="Bot menu description"
            >

          </div>

        </div>

        <textarea
          data-i="${index}"
          data-k="text"
          placeholder="Reply text"
        >${escapeHtml(command.text)}</textarea>

        <div>
          <b>Buttons</b>
        </div>

        <div id="buttons-${index}"></div>

        <button
          type="button"
          class="muted addButtonBtn"
          data-command-index="${index}"
        >
          + Button
        </button>

        <button
          type="button"
          class="danger deleteCommandBtn"
          data-command-index="${index}"
        >
          Delete Command
        </button>

      `;

      list.appendChild(wrapper);

      renderButtons(index);

    }
  );

  attachDynamicEvents();

}


/* =========================
   DYNAMIC BUTTON EVENTS
========================= */

function attachDynamicEvents() {

  document
    .querySelectorAll('.addButtonBtn')
    .forEach(button => {

      button.onclick = function () {

        const index =
          Number(
            this.dataset.commandIndex
          );

        addButton(index);

      };

    });


  document
    .querySelectorAll('.deleteCommandBtn')
    .forEach(button => {

      button.onclick = function () {

        const index =
          Number(
            this.dataset.commandIndex
          );

        deleteCommand(index);

      };

    });

}


/* =========================
   SYNC INPUT FIELDS
========================= */

function syncFields() {

  document
    .querySelectorAll('[data-i][data-k]')
    .forEach(input => {

      const index =
        Number(input.dataset.i);

      const key =
        input.dataset.k;

      if (
        config.commands[index]
      ) {

        config.commands[index][key] =
          input.value;

      }

    });


  document
    .querySelectorAll('[data-b]')
    .forEach(input => {

      const commandIndex =
        Number(input.dataset.i);

      const buttonIndex =
        Number(input.dataset.b);

      const key =
        input.dataset.k;

      const command =
        config.commands[
          commandIndex
        ];

      if (
        command &&
        command.buttons &&
        command.buttons[buttonIndex]
      ) {

        command.buttons[
          buttonIndex
        ][key] = input.value;

      }

    });

}


/* =========================
   RENDER BUTTONS
========================= */

function renderButtons(index) {

  const container =
    document.getElementById(
      `buttons-${index}`
    );

  if (!container) return;

  container.innerHTML = '';

  const buttons =
    config.commands[index].buttons || [];


  buttons.forEach(
    (button, buttonIndex) => {

      const wrapper =
        document.createElement('div');

      wrapper.className = 'btn';

      wrapper.innerHTML = `

        <input
          value="${escapeHtml(button.text)}"
          data-i="${index}"
          data-b="${buttonIndex}"
          data-k="text"
          placeholder="Button text"
        >

        <input
          value="${escapeHtml(button.url)}"
          data-i="${index}"
          data-b="${buttonIndex}"
          data-k="url"
          placeholder="https://..."
        >

        <button
          type="button"
          class="danger deleteButtonBtn"
          data-command-index="${index}"
          data-button-index="${buttonIndex}"
        >
          Remove
        </button>

      `;

      container.appendChild(
        wrapper
      );

    }
  );


  document
    .querySelectorAll('.deleteButtonBtn')
    .forEach(button => {

      button.onclick = function () {

        const commandIndex =
          Number(
            this.dataset.commandIndex
          );

        const buttonIndex =
          Number(
            this.dataset.buttonIndex
          );

        deleteButton(
          commandIndex,
          buttonIndex
        );

      };

    });

}


/* =========================
   ADD COMMAND
========================= */

function addCmd() {

  syncFields();

  config.commands.push({

    command: 'newcommand',

    description: 'New command',

    text: 'Your message here',

    buttons: []

  });

  render();

  showStatus(
    'New command added.'
  );

}


/* =========================
   DELETE COMMAND
========================= */

function deleteCommand(index) {

  syncFields();

  config.commands.splice(
    index,
    1
  );

  render();

  showStatus(
    'Command removed.'
  );

}


/* =========================
   ADD BUTTON
========================= */

function addButton(index) {

  syncFields();

  if (
    !config.commands[index].buttons
  ) {

    config.commands[index].buttons = [];

  }

  config.commands[index].buttons.push({

    text: 'Button',

    url: 'https://'

  });

  render();

  showStatus(
    'Button added.'
  );

}


/* =========================
   DELETE BUTTON
========================= */

function deleteButton(
  commandIndex,
  buttonIndex
) {

  syncFields();

  config.commands[
    commandIndex
  ].buttons.splice(
    buttonIndex,
    1
  );

  render();

  showStatus(
    'Button removed.'
  );

}


/* =========================
   SAVE TO GITHUB
========================= */

async function saveAll() {

  try {

    syncFields();

    showStatus(
      'Saving to GitHub...'
    );

    const result =
      await api(
        'save',
        {
          config
        }
      );

    showStatus(
      result.message ||
      'Saved successfully.'
    );

  } catch (error) {

    showStatus(
      error.message
    );

  }

}


/* =========================
   SYNC TELEGRAM MENU
========================= */

async function syncTelegram() {

  try {

    syncFields();

    showStatus(
      'Syncing Telegram menu...'
    );

    const result =
      await api('sync');

    showStatus(
      result.message ||
      'Telegram menu synced.'
    );

  } catch (error) {

    showStatus(
      error.message
    );

  }

}


/* =========================
   SETUP WEBHOOK
========================= */

async function setupWebhook() {

  try {

    showStatus(
      'Setting up Telegram webhook...'
    );

    const result =
      await api('setup');

    showStatus(
      result.message ||
      'Webhook connected.'
    );

  } catch (error) {

    showStatus(
      error.message
    );

  }

}


/* =========================
   PAGE EVENTS
========================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    const loginBtn =
      document.getElementById(
        'loginBtn'
      );

    const addCommandBtn =
      document.getElementById(
        'addCommandBtn'
      );

    const saveBtn =
      document.getElementById(
        'saveBtn'
      );

    const syncBtn =
      document.getElementById(
        'syncBtn'
      );

    const setupBtn =
      document.getElementById(
        'setupBtn'
      );


    if (loginBtn) {

      loginBtn.onclick =
        login;

    }


    if (addCommandBtn) {

      addCommandBtn.onclick =
        addCmd;

    }


    if (saveBtn) {

      saveBtn.onclick =
        saveAll;

    }


    if (syncBtn) {

      syncBtn.onclick =
        syncTelegram;

    }


    if (setupBtn) {

      setupBtn.onclick =
        setupWebhook;

    }


    const savedSecret =
      localStorage.getItem(
        'queen_admin'
      );

    if (savedSecret) {

      secret =
        savedSecret;

      load();

    }

  }
);

</script>

</body>
</html>`;


/* =========================
   API HANDLER
========================= */

module.exports = async (
  req,
  res
) => {

  if (req.method === 'GET') {

    return res
      .status(200)
      .setHeader(
        'content-type',
        'text/html'
      )
      .send(page);

  }


  if (req.method !== 'POST') {

    return res
      .status(405)
      .json({
        ok: false,
        error: 'POST only'
      });

  }


  if (!auth(req)) {

    return res
      .status(401)
      .json({
        ok: false,
        error: 'Wrong ADMIN_SECRET'
      });

  }


  try {

    const action =
      req.body?.action;


    /* GET CONFIG */

    if (action === 'get') {

      return res.json({

        ok: true,

        config:
          await getConfig()

      });

    }


    /* SAVE CONFIG */

    if (action === 'save') {

      await saveConfig(
        req.body.config
      );

      return res.json({

        ok: true,

        message:
          'Saved to GitHub. Vercel will redeploy automatically if GitHub is connected.'

      });

    }


    /* SYNC TELEGRAM COMMAND MENU */

    if (action === 'sync') {

      const config =
        await getConfig();

      const commands =
        (config.commands || [])
          .map(command => ({

            command:
              String(
                command.command || ''
              )
              .replace(
                /^\//,
                ''
              ),

            description:
              String(
                command.description || ''
              )
              .slice(
                0,
                256
              )

          }))
          .filter(
            command =>
              command.command
          );


      const result =
        await tg(
          'setMyCommands',
          {
            commands
          }
        );


      return res
        .status(
          result.ok
            ? 200
            : 500
        )
        .json({

          ok:
            result.ok,

          message:
            result.ok
              ? 'Telegram command menu synced.'
              : JSON.stringify(result)

        });

    }


    /* SETUP TELEGRAM WEBHOOK */

    if (action === 'setup') {

      const host =
        req.headers.host;

      const proto =
        (
          req.headers[
            'x-forwarded-proto'
          ] || 'https'
        )
        .split(',')[0];


      const url =
        proto +
        '://' +
        host +
        '/api/webhook';


      const webhookBody = {
        url
      };


      if (
        process.env.WEBHOOK_SECRET
      ) {

        webhookBody.secret_token =
          process.env.WEBHOOK_SECRET;

      }


      const result =
        await tg(
          'setWebhook',
          webhookBody
        );


      return res
        .status(
          result.ok
            ? 200
            : 500
        )
        .json({

          ok:
            result.ok,

          message:
            result.ok
              ? 'Webhook connected: ' +
                url
              : JSON.stringify(result)

        });

    }


    return res
      .status(400)
      .json({

        ok: false,

        error:
          'Unknown action'

      });


  } catch (error) {

    console.error(error);

    return res
      .status(500)
      .json({

        ok: false,

        error:
          error.message

      });

  }

};

const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const { getConfig } = require('./config');

const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return r.json();
}

function keyboard(buttons = []) {
  const rows = [];

  for (let i = 0; i < buttons.length; i += 1) {
    const button = buttons[i];

    if (!button || !button.text || !button.url) {
      continue;
    }

    rows.push([
      {
        text: button.text,
        url: button.url
      }
    ]);
  }

  return {
    inline_keyboard: rows
  };
}

async function reply(chatId, item) {
  const payload = {
    chat_id: chatId,
    text: item.text || '',
    disable_web_page_preview: true
  };

  if (
    Array.isArray(item.buttons) &&
    item.buttons.length > 0
  ) {
    payload.reply_markup = keyboard(item.buttons);
  }

  return tg('sendMessage', payload);
}


/*
|--------------------------------------------------------------------------
| Built-in fallback commands
|--------------------------------------------------------------------------
| These are used only if the command is missing from config.
|--------------------------------------------------------------------------
*/

const BUILTIN_COMMANDS = {

  channel: {
    command: 'channel',
    description: 'Join Our Official Telegram Channel',
    text:
      '📢 Official Telegram Channel\n\n' +
      'Get the latest trading signals, market updates, announcements and important updates from Fx Signal Lab.\n\n' +
      '👇 Join our official channel:',
    buttons: [
      {
        text: '📢 Join Official Channel',
        url: 'https://t.me/livesignals_trading'
      }
    ]
  },

  group: {
    command: 'group',
    description: 'Join Our Official Telegram Group',
    text:
      '👥 Official Telegram Group\n\n' +
      'Join our community to stay connected with other traders and receive updates from Fx Signal Lab.\n\n' +
      '👇 Join the group:',
    buttons: [
      {
        text: '👥 Join Official Group',
        url: 'https://t.me/livesignals_tradings'
      }
    ]
  },

  exness: {
    command: 'exness',
    description: 'Open Exness Broker Account',
    text:
      '💼 Exness Broker\n\n' +
      'Open your Exness account through our official partner link.\n\n' +
      '👇 Continue to Exness:',
    buttons: [
      {
        text: '🚀 Open Exness Account',
        url: 'https://one.exnessonelink.com/a/vtkbbmje'
      }
    ]
  },

  xm: {
    command: 'xm',
    description: 'Open XM Broker Account',
    text:
      '💼 XM Broker\n\n' +
      'Access the broker registration link below.\n\n' +
      '👇 Continue:',
    buttons: [
      {
        text: '🚀 Open XM Account',
        url: 'https://trendo.com/invite?market=googleplay&code=3317391'
      }
    ]
  },

  trendo: {
    command: 'trendo',
    description: 'Open Trendo Market Broker Account',
    text:
      '💼 Trendo Market\n\n' +
      'Open Trendo Market using the link below.\n\n' +
      '👇 Register / Open Trendo:',
    buttons: [
      {
        text: '🚀 Open Trendo Market',
        url: 'https://trendo.com/invite?market=googleplay&code=3317391'
      }
    ]
  }

};


async function handle(update) {

  if (!update.message?.chat) {
    return;
  }

  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  // /xm@Queenisupport_bot -> xm
  const commandMatch =
    text.match(/^\/([a-zA-Z0-9_]+)/);

  const inputCommand =
    commandMatch
      ? commandMatch[1].toLowerCase()
      : '';

  if (!inputCommand) {
    return;
  }

  const config =
    await getConfig();

  let commands =
    Array.isArray(config?.commands)
      ? config.commands
      : [];

  /*
  |--------------------------------------------------------------------------
  | Find command in config
  |--------------------------------------------------------------------------
  */

  let item =
    commands.find(c => {

      if (!c || !c.command) {
        return false;
      }

      const cleanCmd =
        String(c.command)
          .replace(/^\//, '')
          .trim()
          .toLowerCase();

      return cleanCmd === inputCommand;

    });


  /*
  |--------------------------------------------------------------------------
  | If new command is missing from config,
  | use built-in command.
  |--------------------------------------------------------------------------
  */

  if (!item && BUILTIN_COMMANDS[inputCommand]) {
    item = BUILTIN_COMMANDS[inputCommand];
  }


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | Do NOT send /start for an unknown command.
  |--------------------------------------------------------------------------
  */

  if (!item) {

    await reply(chatId, {
      text:
        '❓ Command not found.\n\n' +
        'Please use /start to see the available options.',
      buttons: []
    });

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | Help command
  |--------------------------------------------------------------------------
  */

  if (inputCommand === 'help') {

    const list =
      commands
        .filter(c => c && c.command)
        .map(c =>
          `/${String(c.command)
            .replace(/^\//, '')
            .trim()} - ${c.description || ''}`
        )
        .join('\n');

    item = {
      ...item,
      text:
        `${item.text || ''}\n\n${list}`
    };

  }


  await reply(chatId, item);
}


module.exports = async (req, res) => {

  if (req.method !== 'POST') {

    return res.status(405).json({
      ok: false,
      error: 'POST only'
    });

  }


  if (!TOKEN) {

    return res.status(500).json({
      ok: false,
      error: 'BOT_TOKEN is not configured'
    });

  }


  if (
    WEBHOOK_SECRET &&
    req.headers['x-telegram-bot-api-secret-token'] !==
      WEBHOOK_SECRET
  ) {

    return res.status(401).json({
      ok: false
    });

  }


  try {

    await handle(req.body);

    return res.status(200).json({
      ok: true
    });

  } catch (e) {

    console.error(
      'WEBHOOK ERROR:',
      e
    );

    return res.status(500).json({
      ok: false,
      error:
        e && e.message
          ? e.message
          : 'Internal server error'
    });

  }

};

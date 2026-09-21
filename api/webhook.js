const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const { getConfig } = require('./config');

const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

function keyboard(buttons = []) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += 1) {
    rows.push([{ text: buttons[i].text, url: buttons[i].url }]);
  }
  return { inline_keyboard: rows };
}

async function reply(chatId, item) {
  return tg('sendMessage', {
    chat_id: chatId,
    text: item.text || '',
    disable_web_page_preview: true,
    ...(item.buttons && item.buttons.length > 0 ? { reply_markup: keyboard(item.buttons) } : {})
  });
}

async function handle(update) {
  if (!update.message?.chat) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  
  // User ki bheji hui command ko saaf karna (jaise /xm@bot -> xm)
  const commandMatch = text.match(/^\/([a-zA-Z0-9_]+)/);
  const inputCommand = commandMatch ? commandMatch[1].toLowerCase() : '';

  const config = await getConfig();
  let commands = Array.isArray(config.commands) ? config.commands : [];

  // Command ko config mein dhoondna (slash hata kar compare karna)
  let item = commands.find(c => {
    if (!c || !c.command) return false;
    const cleanCmd = String(c.command).replace(/^\//, '').trim().toLowerCase();
    return cleanCmd === inputCommand;
  });

  // Agar specific command na miley, tabhi 'start' use ho
  if (!item) {
    item = commands.find(c => {
      if (!c || !c.command) return false;
      return String(c.command).replace(/^\//, '').trim().toLowerCase() === 'start';
    });
  }

  if (!item) return;

  if (inputCommand === 'help') {
    const list = commands.map(c => `/${String(c.command).replace(/^\//, '').trim()} - ${c.description || ''}`).join('\n');
    item = { ...item, text: `${item.text}\n\n${list}` };
  }

  await reply(chatId, item);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!TOKEN) return res.status(500).json({ ok: false, error: 'BOT_TOKEN is not configured' });
  if (WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false });
  }

  try {
    await handle(req.body);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
};

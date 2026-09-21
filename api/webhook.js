const TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const { getConfig } = require('./config');

const API = `https://api.telegram.org/bot${TOKEN}`;
async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}
function keyboard(buttons = []) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += 1) rows.push([buttons[i]]);
  return { inline_keyboard: rows };
}
async function reply(chatId, item) {
  return tg('sendMessage', {
    chat_id: chatId,
    text: item.text || '',
    disable_web_page_preview: true,
    ...(item.buttons?.length ? { reply_markup: keyboard(item.buttons.map(b => ({text: b.text, url: b.url})))} : {})
  });
}
async function handle(update) {
  if (!update.message?.chat) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const command = text.split(/\s+/)[0].split('@')[0].toLowerCase().replace(/^\//, '');
  const config = await getConfig();
  let item = (config.commands || []).find(c => c.command.toLowerCase() === command);
  if (!item) item = (config.commands || []).find(c => c.command === 'start');
  if (!item) return;
  if (command === 'help') {
    const list = (config.commands || []).map(c => `/${c.command} - ${c.description}`).join('\n');
    item = {...item, text: `${item.text}\n\n${list}`};
  }
  await reply(chatId, item);
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'POST only'});
  if (!TOKEN) return res.status(500).json({ok:false,error:'BOT_TOKEN is not configured'});
  if (WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET) return res.status(401).json({ok:false});
  try { await handle(req.body); return res.status(200).json({ok:true}); }
  catch (e) { console.error(e); return res.status(500).json({ok:false,error:e.message}); }
};

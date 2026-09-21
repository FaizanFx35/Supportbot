const TOKEN = process.env.BOT_TOKEN;
const SETUP_SECRET = process.env.SETUP_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const { getConfig } = require('./config');
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('GET only');
  if (!TOKEN || !SETUP_SECRET) return res.status(500).send('BOT_TOKEN or SETUP_SECRET is missing');
  if (req.query.secret !== SETUP_SECRET) return res.status(403).send('Forbidden');
  const host = req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const webhookUrl = `${proto}://${host}/api/webhook`;
  const config = await getConfig();
  const commands = (config.commands || []).map(c => ({command:c.command, description:(c.description || '').slice(0,256)}));
  const set = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:webhookUrl,...(WEBHOOK_SECRET?{secret_token:WEBHOOK_SECRET}:{})})});
  const setData = await set.json();
  const cmds = await fetch(`https://api.telegram.org/bot${TOKEN}/setMyCommands`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({commands})});
  const cmdData = await cmds.json();
  return res.status(setData.ok && cmdData.ok ? 200 : 500).json({ok:setData.ok && cmdData.ok,webhookUrl,webhook:setData,commands:cmdData});
};

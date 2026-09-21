const { getConfig, saveConfig } = require('./config');
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function esc(s) { return String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function auth(req) { return ADMIN_SECRET && req.headers['x-admin-secret'] === ADMIN_SECRET; }
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  return r.json();
}
const page = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Queen i Support Admin</title><style>
body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7fb;color:#172033;margin:0}.wrap{max-width:900px;margin:auto;padding:20px}.card{background:white;border:1px solid #e5e9f2;border-radius:16px;padding:18px;margin:14px 0;box-shadow:0 3px 14px #00000008}h1{margin:0 0 5px}small{color:#667085}input,textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #d9deea;border-radius:10px;margin:6px 0 12px;font:inherit}textarea{min-height:110px}.row{display:flex;gap:10px;flex-wrap:wrap}.row>*{flex:1;min-width:160px}button{border:0;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer}.primary{background:#2563eb;color:#fff}.muted{background:#eef2f7}.danger{background:#fee2e2;color:#991b1b}.cmd{border:1px solid #e4e8f0;border-radius:12px;padding:14px;margin:10px 0}.btn{background:#f8fafc;padding:10px;border-radius:10px;margin:6px 0;border:1px solid #e5e7eb}.status{padding:10px;border-radius:10px;background:#eef6ff;margin:10px 0;white-space:pre-wrap}.hidden{display:none}.top{display:flex;justify-content:space-between;align-items:center;gap:10px}.pill{background:#eaf2ff;color:#1d4ed8;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700}</style></head><body><div class="wrap"><div class="top"><div><h1>🤖 Queen i Support</h1><small>Private Telegram Bot Admin Panel</small></div><span class="pill">Self-hosted</span></div><div id="login" class="card"><h3>Admin Login</h3><input id="secret" type="password" placeholder="ADMIN_SECRET"><button class="primary" onclick="login()">Open Panel</button></div><div id="panel" class="hidden"><div class="card"><div class="top"><h2>Commands</h2><button class="primary" onclick="addCmd()">+ Add Command</button></div><div id="list"></div><div class="row"><button class="primary" onclick="saveAll()">💾 Save to GitHub</button><button class="muted" onclick="sync()">🔄 Sync Telegram Menu</button><button class="muted" onclick="setup()">⚙️ Setup Webhook</button></div><div id="status" class="status">Ready.</div></div></div></div><script>
let secret='',config={commands:[]};
function login(){secret=document.getElementById('secret').value;if(!secret)return;localStorage.setItem('queen_admin',secret);load()}
async function api(action,body={}){let r=await fetch('/api/admin',{method:'POST',headers:{'content-type':'application/json','x-admin-secret':secret},body:JSON.stringify({action,...body})});let j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Request failed');return j}
async function load(){try{secret=secret||localStorage.getItem('queen_admin')||'';let j=await api('get');config=j.config||{commands:[]};document.getElementById('login').classList.add('hidden');document.getElementById('panel').classList.remove('hidden');render()}catch(e){document.getElementById('status').textContent=e.message}}
function render(){let el=document.getElementById('list');el.innerHTML='';(config.commands||[]).forEach((c,i)=>{let d=document.createElement('div');d.className='cmd';d.innerHTML='<div class="row"><div><b>/</b><input value="'+esc(c.command)+'" data-i="'+i+'" data-k="command"></div><div><input value="'+esc(c.description)+'" data-i="'+i+'" data-k="description" placeholder="Bot menu description"></div></div><textarea data-i="'+i+'" data-k="text" placeholder="Reply text">'+esc(c.text)+'</textarea><div><b>Buttons</b></div><div id="buttons-'+i+'"></div><button class="muted" onclick="addButton('+i+')">+ Button</button> <button class="danger" onclick="delCmd('+i+')">Delete Command</button></div>';el.appendChild(d);renderButtons(i)})}
function esc(s){return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function syncFields(){document.querySelectorAll('[data-i]').forEach(x=>{let i=+x.dataset.i,k=x.dataset.k;config.commands[i][k]=x.value})}
function renderButtons(i){let el=document.getElementById('buttons-'+i);el.innerHTML='';(config.commands[i].buttons||[]).forEach((b,j)=>{let d=document.createElement('div');d.className='btn';d.innerHTML='<input value="'+esc(b.text)+'" data-i="'+i+'" data-b="'+j+'" data-k="text" placeholder="Button text"><input value="'+esc(b.url)+'" data-i="'+i+'" data-b="'+j+'" data-k="url" placeholder="https://..."><button class="danger" onclick="delButton('+i+','+j+')">Remove</button>';el.appendChild(d)})}
function addCmd(){syncFields();config.commands.push({command:'newcommand',description:'New command',text:'Your message here',buttons:[]});render()}
function delCmd(i){syncFields();config.commands.splice(i,1);render()}
function addButton(i){syncFields();config.commands[i].buttons=config.commands[i].buttons||[];config.commands[i].buttons.push({text:'Button',url:'https://'});render()}
function delButton(i,j){syncFields();config.commands[i].buttons.splice(j,1);render()}
async function saveAll(){try{syncFields();let j=await api('save',{config});status(j.message||'Saved.')}catch(e){status(e.message)}}
async function sync(){try{syncFields();let j=await api('sync');status(j.message||'Synced.')}catch(e){status(e.message)}}
async function setup(){try{let j=await api('setup');status(j.message||'Setup complete.')}catch(e){status(e.message)}}
function status(s){document.getElementById('status').textContent=s}
if(localStorage.getItem('queen_admin')){secret=localStorage.getItem('queen_admin');load()}
</script></body></html>`;

module.exports = async (req,res) => {
  if (req.method === 'GET') return res.status(200).setHeader('content-type','text/html').send(page);
  if (req.method !== 'POST') return res.status(405).json({ok:false,error:'POST only'});
  if (!auth(req)) return res.status(401).json({ok:false,error:'Wrong ADMIN_SECRET'});
  try {
    const action=req.body?.action;
    if(action==='get') return res.json({ok:true,config:await getConfig()});
    if(action==='save'){await saveConfig(req.body.config);return res.json({ok:true,message:'Saved to GitHub. Vercel will redeploy automatically if GitHub is connected.'})}
    if(action==='sync'){const c=await getConfig();const commands=(c.commands||[]).map(x=>({command:x.command.replace(/^\//,''),description:(x.description||'').slice(0,256)}));const out=await tg('setMyCommands',{commands});return res.status(out.ok?200:500).json({ok:out.ok,message:out.ok?'Telegram command menu synced.':JSON.stringify(out)});}
    if(action==='setup'){const host=req.headers.host;const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];const url=proto+'://'+host+'/api/webhook';const out=await tg('setWebhook',{url,...(process.env.WEBHOOK_SECRET?{secret_token:process.env.WEBHOOK_SECRET}:{})});return res.status(out.ok?200:500).json({ok:out.ok,message:out.ok?'Webhook connected: '+url:JSON.stringify(out)});}
    return res.status(400).json({ok:false,error:'Unknown action'});
  } catch(e){console.error(e);return res.status(500).json({ok:false,error:e.message})}
};

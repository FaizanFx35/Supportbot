const DEFAULT_CONFIG = require('../bot-config.json');

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  return r.json();
}

async function getConfig() {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) return DEFAULT_CONFIG;
  try {
    const data = await githubRequest('bot-config.json');
    return JSON.parse(Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'));
  } catch (e) {
    console.error('Config read failed:', e.message);
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(config) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error('GITHUB_TOKEN and GITHUB_REPO are required for saving from the Admin Panel.');
  const branch = process.env.GITHUB_BRANCH || 'main';
  const current = await githubRequest('bot-config.json');
  const content = Buffer.from(JSON.stringify(config, null, 2) + '\n').toString('base64');
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/bot-config.json`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update Telegram bot settings from Admin Panel',
      content,
      sha: current.sha,
      branch
    })
  });
  if (!r.ok) throw new Error(`GitHub save ${r.status}: ${await r.text()}`);
  return r.json();
}

module.exports = { getConfig, saveConfig };

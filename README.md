# Queen i Support — Self-hosted Telegram Bot + Admin Panel

This version replaces TeleMinute. It runs on Vercel, uses GitHub as the settings store, and gives you a private web Admin Panel to edit commands, replies and buttons.

## Vercel Environment Variables
Required:
- BOT_TOKEN = BotFather token
- SETUP_SECRET = random secret
- WEBHOOK_SECRET = random secret
- ADMIN_SECRET = private password for `/api/admin`
- GITHUB_TOKEN = GitHub fine-grained token with Contents: Read and write on this repository
- GITHUB_REPO = owner/repository (example: live-signal29/queen-i-support-bot)
- GITHUB_BRANCH = main

## First setup
1. Upload this project to GitHub and import it into Vercel.
2. Add the environment variables above.
3. Deploy.
4. Open `https://YOUR-VERCEL-DOMAIN.vercel.app/api/setup?secret=YOUR_SETUP_SECRET` once.
5. Open `https://YOUR-VERCEL-DOMAIN.vercel.app/api/admin` and enter ADMIN_SECRET.
6. Edit commands/buttons and press Save to GitHub. Vercel will redeploy automatically when GitHub is connected.
7. Use Sync Telegram Menu after changing command names/descriptions.

## Security
Never put BOT_TOKEN, ADMIN_SECRET, GITHUB_TOKEN or other secrets in GitHub files. If a BotFather token is exposed, revoke it with BotFather and set the new token in Vercel.

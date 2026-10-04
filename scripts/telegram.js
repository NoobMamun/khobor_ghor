// Helper for setting up Telegram alerts.
//   npm run telegram:chatid   -> prints chat ids that have messaged your bot
//   npm run telegram:test     -> sends a test message using .env
import fs from 'node:fs';
import { sendTelegram } from '../server/lib/notifier.js';

if (fs.existsSync('.env')) process.loadEnvFile('.env');
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('Put TELEGRAM_BOT_TOKEN=... in .env first (see .env.example).'); process.exit(1); }

const cmd = process.argv[2];
if (cmd === 'chatid') {
  const res = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates`)).json();
  if (!res.ok) { console.error('Telegram said:', res.description); process.exit(1); }
  const chats = new Map();
  for (const u of res.result) {
    const c = (u.message || u.channel_post || u.my_chat_member)?.chat;
    if (c) chats.set(c.id, c.title || c.username || c.first_name || '');
  }
  if (!chats.size) console.log('No messages found. Open your bot in Telegram, press Start / send "hi", then run this again.');
  for (const [id, name] of chats) console.log(`TELEGRAM_CHAT_ID=${id}   (${name})`);
} else if (cmd === 'test') {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) { console.error('Put TELEGRAM_CHAT_ID=... in .env first.'); process.exit(1); }
  await sendTelegram('✅ <b>খবরঘর</b> alerts are connected. You will get new headlines here.', { token, chatId });
  console.log('Test message sent.');
} else {
  console.log('Usage: node scripts/telegram.js chatid | test');
}

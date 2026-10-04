// Telegram notifier: polls every newspaper and messages new headlines.
// Configured only through environment variables (see .env.example); disabled if unset.
import fs from 'node:fs';
import path from 'node:path';
import { newspapers } from '../newspapers/index.js';
import { getNews } from './service.js';

const SEEN_FILE = path.join(process.cwd(), 'data', 'seen.json');
const MAX_PER_ROUND = 8; // never flood the chat, even after downtime
const SEND_GAP_MS = 1200; // Telegram allows ~1 message/second per chat

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function sendTelegram(text, { token, chatId }) {
  const base = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org'; // overridable for tests
  const res = await fetch(`${base}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true }, // text only: no publisher images in Telegram either
    }),
  });
  if (!res.ok) throw new Error(`Telegram HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8').replace(/^﻿/, ''));
  } catch {
    return null; // first run
  }
}
function saveSeen(seen) {
  fs.mkdirSync(path.dirname(SEEN_FILE), { recursive: true });
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen));
}

const format = (paper, a) =>
  `📰 <b>${esc(paper.name)}</b>${a.category ? ` · ${esc(a.category)}` : ''}\n${esc(a.title)}\n<a href="${esc(a.url)}">${esc(paper.language === 'bn' ? 'মূল প্রতিবেদন পড়ুন' : 'Read original')}</a>`;

export function startNotifier() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('Telegram alerts: off (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env to enable)');
    return;
  }
  const everyMin = Math.max(1, Number(process.env.NOTIFY_INTERVAL_MIN) || 3);
  const creds = { token, chatId };
  let seen = loadSeen(); // { paperId: [urls...] }; null on first run
  let running = false;

  async function round() {
    if (running) return;
    running = true;
    const firstRun = seen === null;
    seen = seen || {};
    try {
      for (const paper of newspapers) {
        let data;
        try {
          data = await getNews(paper, { refresh: true });
        } catch (err) {
          console.error(`[notify:${paper.id}] fetch failed: ${err.message}`);
          continue;
        }
        const known = new Set(seen[paper.id] || []);
        const fresh = data.articles.filter((a) => !known.has(a.url));
        // First ever run only records what exists, so you don't get 30 old headlines at once.
        const toSend = firstRun || !seen[paper.id] ? [] : fresh.slice(0, MAX_PER_ROUND).reverse(); // oldest first
        let failed = false;
        for (const a of toSend) {
          try {
            await sendTelegram(format(paper, a), creds);
            known.add(a.url);
            await sleep(SEND_GAP_MS);
          } catch (err) {
            console.error(`[notify:${paper.id}] send failed: ${err.message}`);
            failed = true;
            break; // unsent ones stay "new" and are retried next round
          }
        }
        // If nothing failed, everything currently in the feed counts as seen
        // (stories beyond the per-round cap are skipped rather than re-alerted forever).
        if (!failed) for (const a of data.articles) known.add(a.url);
        // Keep the list bounded: only URLs still in the current feed window matter.
        const current = new Set(data.articles.map((a) => a.url));
        seen[paper.id] = [...known].filter((u) => current.has(u));
      }
      saveSeen(seen);
    } finally {
      running = false;
    }
  }

  console.log(`Telegram alerts: on (checking every ${everyMin} min)`);
  round();
  setInterval(round, everyMin * 60 * 1000);
}

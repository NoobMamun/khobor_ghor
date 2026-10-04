import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newspapers, getNewspaper, publicInfo } from './newspapers/index.js';
import { SECTIONS } from './sections.js';
import { getNews } from './lib/service.js';
import { startNotifier } from './lib/notifier.js';

if (fs.existsSync('.env')) process.loadEnvFile('.env'); // local secrets (Telegram token); never sent to the browser

const app = express();
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  });
  next();
});

app.get('/api/newspapers', (req, res) => {
  res.json({
    default: newspapers[0].id,
    newspapers: newspapers.map(publicInfo),
    sections: SECTIONS,
  });
});

app.get('/api/news/:id', async (req, res) => {
  const newspaper = getNewspaper(req.params.id);
  if (!newspaper) return res.status(404).json({ error: 'Unknown newspaper' });
  try {
    const data = await getNews(newspaper, { refresh: req.query.refresh === '1' });
    res.set('Cache-Control', 'no-store');
    res.json(data);
  } catch (err) {
    console.error(`[${newspaper.id}]`, err.message);
    res.status(502).json({ error: `Could not load ${newspaper.name} right now.` });
  }
});

app.use(express.static(publicDir, { extensions: ['html'], maxAge: '5m' }));

export default app; // used by api/index.js when deployed on Vercel (serverless)

// Locally / on an always-on host we run a real server. On Vercel the platform calls the
// exported app per request, so we must not listen (and a background timer would not survive).
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`News portal running at http://localhost:${port}`);
    startNotifier();
  });
}

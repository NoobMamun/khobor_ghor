# খবরঘর — Bangladesh News Hub

A news discovery portal: pick a newspaper, browse its latest headlines by section, search, and open the original article on the publisher's site. Currently: **Prothom Alo** (Bangla) and **The Daily Star** (English).

```
npm install
npm start        # http://localhost:3000
npm test
```

## Architecture

```
server/
  newspapers/        one config file per paper + index.js registry   <- the only place to touch to add a paper
  lib/rss.js         RSS 2.0 parsing + normalisation into a common Article shape
  lib/text.js        sanitising (tags stripped, entities decoded, only https URLs kept)
  lib/service.js     fetch all feeds of a paper, merge, de-duplicate, cache (5 min), serve stale on failure
  sections.js        canonical sections (Bangladesh, Politics, World, …) with Bangla/English labels
  index.js           Express: GET /api/newspapers, GET /api/news/:id[?refresh=1], static files, CSP
public/              no-build ES-module frontend (components/card.js, components/views.js, app.js)
```

The browser only talks to `/api/*` — newspaper sites are fetched server-side (no CORS issues, one shared cache, one place to sanitise). No API keys are needed or present.

## Adding a newspaper

1. Create `server/newspapers/ittefaq.js`:

```js
export default {
  id: 'ittefaq', name: 'Ittefaq', nativeName: 'ইত্তেফাক', language: 'bn',
  monogram: 'ই', brandColor: '#1b7f4b', logo: null, homepage: 'https://www.ittefaq.com.bd',
  feeds: [
    { url: 'https://…/politics/rss.xml', section: 'politics' },   // section fixed per feed, or…
    { url: 'https://…/rss.xml' },                                  // …derived via sectionByPath (see prothom-alo.js)
  ],
  // optional: sectionByPath
};
```

2. Add it to the `newspapers` array in `server/newspapers/index.js`.

The header tab, section navigation, search, caching, refresh and error handling all pick it up automatically. A paper whose feed isn't standard RSS 2.0 would need a small custom parser added to `lib/rss.js`.

## Behaviour notes

- **Switching** is client-side; loaded papers are kept in memory, so switching back is instant and revalidated in the background if older than 5 minutes. URL hash (`#/daily-star/sports`) is shareable.
- **Refresh** button forces a refetch (server throttles to once per 30 s per paper); the page also refreshes itself every 5 min while visible. If a fetch fails but older data exists, the older data is shown with a notice and Retry; with no data, a full error state with Retry.
- **Search** filters the selected paper's loaded articles (title, summary, category), Bangla and English.
- **No publisher images.** To avoid any copyright claim the portal never fetches or displays photos or logos from the newspapers: only headline, short summary, section, time and source, linking to the original article. The CSP also blocks remote images.
- **Latest 15 only:** each paper is capped at its 15 newest stories (`MAX_ARTICLES` in `server/lib/service.js`, or `maxArticles` in a paper's config), so sections, "Latest" and search only cover those.
- Only titles/summaries are shown; nothing of article bodies is stored or displayed.

## Telegram alerts

While the server runs, it checks every paper every 3 minutes and sends each newly published headline (title, section, source, link; text only) to a Telegram chat.

1. In Telegram open **@BotFather** → `/newbot` → copy the bot token.
2. Open your new bot, press **Start** and send "hi".
3. Copy `.env.example` to `.env`, paste the token as `TELEGRAM_BOT_TOKEN=`.
4. Run `npm run telegram:chatid`, paste the printed id as `TELEGRAM_CHAT_ID=` in `.env`.
5. Run `npm run telegram:test` (you should get a message), then restart `npm start`.

Notes: the first run only records current stories (no flood of old news); at most 8 alerts per paper per round; seen stories are remembered in `data/seen.json` so restarts don't repeat alerts. Alerts only run while the server is running. `.env` is git-ignored and never sent to the browser.

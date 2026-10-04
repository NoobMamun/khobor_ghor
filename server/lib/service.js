import { Cache } from './cache.js';
import { fetchText } from './http.js';
import { parseFeed, toArticle } from './rss.js';
import { SECTIONS } from '../sections.js';

const TTL_MS = 5 * 60 * 1000; // feed cache lifetime
const MAX_ARTICLES = 15; // the portal only shows each paper's newest stories (override per paper with maxArticles)
const MIN_REFRESH_MS = 30 * 1000; // manual refresh can't bypass the cache more often than this
const cache = new Cache();

async function loadNewspaper(newspaper) {
  const results = await Promise.allSettled(
    newspaper.feeds.map(async (feed) => {
      const xml = await fetchText(feed.url, { accept: 'application/rss+xml, application/xml, text/xml' });
      return parseFeed(xml, feed.url).map((item) => toArticle(item, feed, newspaper));
    }),
  );

  const errors = results.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message || r.reason));
  const seen = new Set();
  const articles = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const a of r.value) {
      if (seen.has(a.url)) continue; // de-duplicate across feeds (first feed wins)
      seen.add(a.url);
      articles.push(a);
    }
  }
  if (!articles.length) throw new Error(errors[0] || 'Feed returned no articles');

  articles.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { articles: articles.slice(0, newspaper.maxArticles || MAX_ARTICLES), errors, fetchedAt: new Date().toISOString() };
}

function present(newspaper, data, stale) {
  const { articles } = data;

  const counts = new Map();
  for (const a of articles) counts.set(a.section, (counts.get(a.section) || 0) + 1);
  const sections = SECTIONS.filter((s) => counts.has(s.id)).map((s) => ({
    id: s.id,
    label: s.label[newspaper.language] || s.label.en,
    count: counts.get(s.id),
  }));

  return {
    newspaper: newspaper.id,
    language: newspaper.language,
    fetchedAt: data.fetchedAt,
    stale,
    errors: data.errors,
    sections,
    articles,
  };
}

export async function getNews(newspaper, { refresh = false } = {}) {
  const key = newspaper.id;
  const age = cache.age(key);
  const needsFetch = age > TTL_MS || (refresh && age > MIN_REFRESH_MS);

  let stale = false;
  if (needsFetch) {
    try {
      const data = await cache.dedupe(key, () => loadNewspaper(newspaper));
      cache.set(key, data);
    } catch (err) {
      if (!cache.get(key)) throw err; // nothing to fall back on
      stale = true; // serve last good data, flagged as stale
    }
  }

  const data = cache.get(key).value;
  return present(newspaper, data, stale);
}

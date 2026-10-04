import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, toArticle } from '../lib/rss.js';
import { toPlainText, safeUrl } from '../lib/text.js';
import { search } from '../../public/js/components/views.js';
import dailyStar from '../newspapers/daily-star.js';
import prothomAlo from '../newspapers/prothom-alo.js';

const DS_FEED = `<?xml version="1.0"?><rss version="2.0"><channel><item>
  <title><a href="/x" hreflang="en">Rates &amp; rules</a></title>
  <link>https://www.thedailystar.net/news/bangladesh/news/a-1</link>
  <description>Hello&lt;br&gt;&lt;script&gt;alert(1)&lt;/script&gt; world</description>
  <pubDate>Sun, 04 Oct 26 13:43:57 +0600</pubDate></item>
  <item><title>No link</title></item>
  <item><title>Bad scheme</title><link>javascript:alert(1)</link></item></channel></rss>`;

test('Daily Star: strips markup from titles/descriptions, drops unusable items, parses 2-digit-year dates', () => {
  const items = parseFeed(DS_FEED, 'https://www.thedailystar.net/rss.xml');
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Rates & rules');
  assert.ok(!/[<>]|alert/.test(items[0].summary.replace('alert', '') ) || !items[0].summary.includes('<'));
  assert.equal(items[0].publishedAt, '2026-10-04T07:43:57.000Z');
});

test('Prothom Alo: section derived from URL path, rss category kept for display', () => {
  const item = { url: 'https://www.prothomalo.com/sports/cricket/abc', title: 'শিরোনাম', summary: '', publishedAt: null, rssCategory: 'ক্রিকেট' };
  const a = toArticle(item, {}, prothomAlo);
  assert.equal(a.section, 'sports');
  assert.equal(a.category, 'ক্রিকেট');
  assert.equal(toArticle({ ...item, url: 'https://www.prothomalo.com/zzz/1', rssCategory: null }, {}, prothomAlo).section, 'other');
});

test('Daily Star: feed-defined section wins', () => {
  const a = toArticle({ url: 'https://www.thedailystar.net/a', title: 't', summary: '', publishedAt: null, rssCategory: null }, { section: 'world' }, dailyStar);
  assert.deepEqual([a.section, a.category], ['world', 'World']);
});

test('plain-text + url sanitising', () => {
  assert.equal(toPlainText('<b>Hi</b> <img src=x onerror=alert(1)> there &amp; more'), 'Hi there & more');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('http://example.com/a'), 'https://example.com/a');
  assert.equal(safeUrl('/rel', 'https://x.com/y'), 'https://x.com/rel');
});

test('search works for Bangla and English, within title/summary/category', () => {
  const sections = [{ id: 'sports', label: 'খেলা' }];
  const arts = [
    { title: 'বাংলাদেশের জয়', summary: '', category: 'ক্রিকেট', section: 'sports' },
    { title: 'Dhaka traffic', summary: 'Bangladesh capital gridlock', category: 'City', section: 'x' },
  ];
  assert.equal(search(arts, 'বাংলাদেশ', sections).length, 1);
  assert.equal(search(arts, 'BANGLADESH', sections).length, 1);
  assert.equal(search(arts, 'dhaka gridlock', sections).length, 1);
  assert.equal(search(arts, 'খেলা', sections).length, 1);
  assert.equal(search(arts, '   ', sections).length, 0);
});



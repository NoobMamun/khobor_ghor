import { XMLParser } from 'fast-xml-parser';
import { textOf, toPlainText, safeUrl } from './text.js';
import { SECTION_BY_ID } from '../sections.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
  isArray: (name) => name === 'item' || name === 'media:content' || name === 'media:thumbnail' || name === 'enclosure',
});

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

function parseDate(raw) {
  const t = Date.parse(String(raw || '').trim());
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

// Raw RSS XML -> array of loosely-normalised items (no section yet).
export function parseFeed(xml, feedUrl) {
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item;
  if (!items) throw new Error('Not a valid RSS 2.0 feed');

  return items
    .map((item) => {
      const url = safeUrl(textOf(item.link) || textOf(item.guid), feedUrl);
      const title = toPlainText(textOf(item.title), 300);
      if (!url || !title) return null; // unusable without a headline and a destination

      const summarySource = textOf(item.description) || textOf(item['content:encoded']);
      let summary = toPlainText(summarySource, 240);
      if (summary === title) summary = '';

      return {
        url,
        title,
        summary,
        publishedAt: parseDate(textOf(item.pubDate)) || parseDate(textOf(item['atom:updated'])),
        rssCategory: toPlainText(textOf(arr(item.category)[0]), 60) || null,
      };
    })
    .filter(Boolean);
}

// Decide the canonical section for an item.
export function resolveSection(item, feed, newspaper) {
  if (feed.section) return feed.section;
  if (newspaper.sectionByPath) {
    const seg = new URL(item.url).pathname.split('/').filter(Boolean)[0];
    if (seg && newspaper.sectionByPath[seg]) return newspaper.sectionByPath[seg];
  }
  return 'other';
}

export function toArticle(item, feed, newspaper) {
  const sectionId = resolveSection(item, feed, newspaper);
  const lang = newspaper.language;
  const sectionLabel = SECTION_BY_ID[sectionId]?.label[lang] || SECTION_BY_ID[sectionId]?.label.en || sectionId;
  return {
    id: item.url,
    title: item.title,
    summary: item.summary,
    publishedAt: item.publishedAt,
    section: sectionId,
    // Prefer the paper's own (more specific) category label for display, e.g. "জেলা".
    category: (newspaper.useRssCategory !== false && item.rssCategory) || sectionLabel,
    source: newspaper.id,
    url: item.url,
  };
}

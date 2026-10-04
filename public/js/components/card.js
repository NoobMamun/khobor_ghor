import { esc, safeHref, relativeTime, fullDate } from '../util.js';

// The portal deliberately shows no publisher images (copyright): text, source and a link only.

// At most two sentences (and ~220 characters) so every card is quick to scan.
export function shortSummary(text, max = 220) {
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?।])\s+/);
  let out = sentences.slice(0, 2).join(' ');
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}

function timeParts(a, locale) {
  if (!a.publishedAt) return '';
  return `<time class="dot" datetime="${esc(a.publishedAt)}">${esc(fullDate(a.publishedAt, locale))}</time>` +
    `<span class="dot ago">${esc(relativeTime(a.publishedAt, locale))}</span>`;
}

// Source name first (coloured), then category and time: the scan line of the compact card.
function sourceMeta(a, paper, locale) {
  return `<div class="meta"><span class="src" data-brand="${esc(paper.brandColor)}">${esc(paper.name)}</span>` +
    `<span class="dot cat">${esc(a.category)}</span>${timeParts(a, locale)}</div>`;
}

function meta(a, paper, locale) {
  return `<div class="meta"><span class="cat">${esc(a.category)}</span><span class="dot">${esc(paper.name)}</span>${timeParts(a, locale)}</div>`;
}

// variant: 'compact' (merged landing feed) | 'row' (single-paper feed item)
// The whole card is one link to the original article, opened in a new tab.
// opts.locale overrides the language used for dates (the landing page is always English).
export function Card(a, paper, variant = 'row', { locale = paper.language } = {}) {
  const lang = esc(paper.language); // so Bangla headlines get Bangla fonts/line-height even on the English page
  const summary = shortSummary(a.summary);
  const head = `<h3 class="headline" lang="${lang}">${esc(a.title)}</h3>`;
  const sum = summary ? `<p class="summary" lang="${lang}">${esc(summary)}</p>` : '';
  const inner = variant === 'compact' ? `${sourceMeta(a, paper, locale)}${head}${sum}` : `${head}${sum}${meta(a, paper, locale)}`;
  return `<article class="card ${variant}"><a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer">${inner}</a></article>`;
}

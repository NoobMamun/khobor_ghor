import { esc, safeHref, relativeTime, fullDate } from '../util.js';

// The portal deliberately shows no publisher images (copyright): text, source and a link only.

function meta(a, paper) {
  // Exact publication date/time plus a relative hint ("2 hours ago"), both in the paper's language.
  const time = a.publishedAt
    ? `<time class="dot" datetime="${esc(a.publishedAt)}">${esc(fullDate(a.publishedAt, paper.language))}</time>` +
      `<span class="dot ago">${esc(relativeTime(a.publishedAt, paper.language))}</span>`
    : '';
  return `<div class="meta"><span class="cat">${esc(a.category)}</span><span class="dot">${esc(paper.name)}</span>${time}</div>`;
}

// variant: 'row' (feed list item) | 'lead' | 'v' | 'h'
// The whole card is one link to the original article, opened in a new tab.
export function Card(a, paper, variant = 'v') {
  const summary = variant !== 'h' && a.summary ? `<p class="summary">${esc(a.summary)}</p>` : '';
  return `<article class="card ${variant}"><a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<h3 class="headline">${esc(a.title)}</h3>${summary}${meta(a, paper)}</a></article>`;
}

import { esc, safeHref, relativeTime, fullDate } from '../util.js';

// The portal deliberately shows no publisher images (copyright): text, source and a link only.

function meta(a, paper) {
  const time = a.publishedAt
    ? `<time class="dot" datetime="${esc(a.publishedAt)}" title="${esc(fullDate(a.publishedAt, paper.language))}">${esc(relativeTime(a.publishedAt, paper.language))}</time>`
    : '';
  return `<div class="meta"><span class="cat">${esc(a.category)}</span><span class="dot">${esc(paper.name)}</span>${time}</div>`;
}

// variant: 'lead' (big) | 'v' (grid card) | 'h' (compact row)
// The whole card is one link to the original article, opened in a new tab.
export function Card(a, paper, variant = 'v') {
  const summary = variant !== 'h' && a.summary ? `<p class="summary">${esc(a.summary)}</p>` : '';
  return `<article class="card ${variant}"><a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<h3 class="headline">${esc(a.title)}</h3>${summary}${meta(a, paper)}</a></article>`;
}

// Compact "Latest" list entry (time first, headline only).
export function LatestItem(a, paper) {
  const time = a.publishedAt ? relativeTime(a.publishedAt, paper.language) : esc(a.category);
  return `<li><a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="t">${esc(time)}</span><h3 class="headline">${esc(a.title)}</h3></a></li>`;
}

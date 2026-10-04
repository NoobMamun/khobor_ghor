import { esc, norm } from '../util.js';
import { t } from '../i18n.js';
import { Card } from './card.js';

const PAGE = 25;

// One clean, newest-first list. `sectionId` 'all' shows every configured section together.
export function FeedView(data, paper, sectionId, shown) {
  const L = t(paper.language);
  const items = sectionId === 'all' ? data.articles : data.articles.filter((a) => a.section === sectionId);
  if (!items.length) return StateView('📰', '', L.empty);
  const title = sectionId === 'all' ? L.allNews : data.sections.find((s) => s.id === sectionId)?.label || '';
  return `<section class="feed" aria-label="${esc(title)}">
    <h1 class="page-title">${esc(title)}</h1>
    <div class="rows">${items.slice(0, shown).map((a) => Card(a, paper, 'row')).join('')}</div>
    ${items.length > shown ? `<div class="more"><button class="btn primary" type="button" data-more>${esc(L.loadMore)}</button></div>` : ''}
  </section>`;
}

export function search(articles, query, sections) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const label = Object.fromEntries(sections.map((s) => [s.id, s.label]));
  return articles.filter((a) => {
    const hay = norm(`${a.title} ${a.summary} ${a.category} ${label[a.section] || ''}`);
    return words.every((w) => hay.includes(w));
  });
}

export function SearchView(data, paper, query, shown) {
  const L = t(paper.language);
  const hits = search(data.articles, query, data.sections);
  if (!hits.length) return StateView('🔍', L.noResults(query), L.noResultsHint);
  return `<section class="feed">
    <h1 class="page-title">${esc(L.results(hits.length, query))}</h1>
    <div class="rows">${hits.slice(0, shown).map((a) => Card(a, paper, 'row')).join('')}</div>
    ${hits.length > shown ? `<div class="more"><button class="btn primary" type="button" data-more>${esc(L.loadMore)}</button></div>` : ''}
  </section>`;
}

export function StateView(icon, title, body, retryLabel) {
  return `<div class="state"><div class="big" aria-hidden="true">${icon}</div>${title ? `<h2>${esc(title)}</h2>` : ''}<p>${esc(body)}</p>
    ${retryLabel ? `<button class="btn primary" type="button" data-retry>${esc(retryLabel)}</button>` : ''}</div>`;
}

export function LoadingView() {
  const row = `<div class="skel-row"><div class="skel skel-line big"></div><div class="skel skel-line w85"></div><div class="skel skel-line w60"></div></div>`;
  return `<section class="feed" aria-busy="true" aria-label="Loading"><div class="skel skel-title"></div><div class="rows">${row.repeat(6)}</div></section>`;
}

export { PAGE };

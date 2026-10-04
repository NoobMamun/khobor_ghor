import { esc, norm } from '../util.js';
import { t } from '../i18n.js';
import { Card } from './card.js';

const PAGE = 25;
const PER_SOURCE = 6; // stories per source in the "By source" view

const isAll = (paper) => paper.id === 'all';

// One list item. On the landing page each story is drawn with its own paper's name/colour.
function row(a, data, paper) {
  if (isAll(paper)) return Card(a, data.papersById[a.source] || paper, 'compact', { locale: 'en' });
  return Card(a, paper, 'row');
}

const loadMore = (L, total, shown) =>
  total > shown ? `<div class="more"><button class="btn primary" type="button" data-more>${esc(L.loadMore)}</button></div>` : '';

function groupToggle(group) {
  const b = (id, label) => `<button type="button" data-group="${id}" aria-pressed="${group === id}">${label}</button>`;
  return `<div class="seg" role="group" aria-label="View">${b('time', 'Latest')}${b('source', 'By source')}</div>`;
}

// Landing page, grouped: one block per newspaper, its newest stories underneath.
function SourceView(data, sectionId, items, L) {
  const blocks = data.papers.map((p) => {
    const mine = items.filter((a) => a.source === p.id);
    if (!mine.length) return '';
    const more = mine.length > PER_SOURCE
      ? `<button class="link-more" type="button" data-paper="${esc(p.id)}">${esc(`Open ${p.name} (${mine.length}) →`)}</button>` : '';
    return `<section class="src-block" aria-label="${esc(p.name)}">
      <div class="src-head"><h2><span class="src" data-brand="${esc(p.brandColor)}">${esc(p.name)}</span></h2>${more}</div>
      <div class="rows">${mine.slice(0, PER_SOURCE).map((a) => row(a, data, { id: 'all' })).join('')}</div></section>`;
  }).join('');
  return blocks || `<div class="state"><p>${esc(L.empty)}</p></div>`;
}

// One clean, newest-first list. `sectionId` 'all' shows every configured section together.
// On the landing page (paper.id === 'all') this merges all newspapers.
export function FeedView(data, paper, sectionId, shown, group = 'time') {
  const all = isAll(paper);
  const L = t(paper.language);
  const items = sectionId === 'all' ? data.articles : data.articles.filter((a) => a.section === sectionId);
  if (!items.length) return StateView('📰', '', L.empty);
  const label = sectionId === 'all' ? '' : data.sections.find((s) => s.id === sectionId)?.label || '';

  if (all) {
    const sources = new Set(items.map((a) => a.source)).size;
    const title = label ? `${label} headlines` : 'Latest headlines';
    return `<section class="feed" aria-label="${esc(title)}">
      <div class="feed-head"><div><h1 class="page-title">${esc(title)}</h1>
        <p class="page-sub">${items.length} stories from ${sources} ${sources === 1 ? 'source' : 'sources'}, newest first</p></div>${groupToggle(group)}</div>
      ${group === 'source'
        ? SourceView(data, sectionId, items, L)
        : `<div class="rows">${items.slice(0, shown).map((a) => row(a, data, paper)).join('')}</div>${loadMore(L, items.length, shown)}`}
    </section>`;
  }

  const title = sectionId === 'all' ? L.allNews : label;
  return `<section class="feed" aria-label="${esc(title)}">
    <h1 class="page-title">${esc(title)}</h1>
    <div class="rows">${items.slice(0, shown).map((a) => row(a, data, paper)).join('')}</div>
    ${loadMore(L, items.length, shown)}
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
    <div class="rows">${hits.slice(0, shown).map((a) => row(a, data, paper)).join('')}</div>
    ${loadMore(L, hits.length, shown)}
  </section>`;
}

export function StateView(icon, title, body, retryLabel) {
  return `<div class="state"><div class="big" aria-hidden="true">${icon}</div>${title ? `<h2>${esc(title)}</h2>` : ''}<p>${esc(body)}</p>
    ${retryLabel ? `<button class="btn primary" type="button" data-retry>${esc(retryLabel)}</button>` : ''}</div>`;
}

export function LoadingView() {
  const row = `<div class="skel-row"><div class="skel skel-line"></div><div class="skel skel-line big"></div><div class="skel skel-line w85"></div></div>`;
  return `<section class="feed" aria-busy="true" aria-label="Loading"><div class="skel skel-title"></div><div class="rows">${row.repeat(7)}</div></section>`;
}

export { PAGE };

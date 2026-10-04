import { esc, norm } from '../util.js';
import { t } from '../i18n.js';
import { Card, LatestItem } from './card.js';

const PAGE = 24;

// Top stories: newest stories, preferring one per section for variety.
export function pickTop(articles, n = 5) {
  const pool = articles.slice(0, 40);
  const picked = [];
  const seen = new Set();
  for (const a of pool) {
    if (!seen.has(a.section) && a.summary) { seen.add(a.section); picked.push(a); }
    if (picked.length === n) return picked;
  }
  for (const a of pool) {
    if (!picked.includes(a)) picked.push(a);
    if (picked.length === n) break;
  }
  return picked;
}

const blockTitle = (title, action = '') =>
  `<div class="block-title"><h2>${esc(title)}</h2>${action}</div>`;

export function HomeView(data, paper) {
  const L = t(paper.language);
  const top = pickTop(data.articles);
  const topIds = new Set(top.map((a) => a.id));
  const [lead, ...rest] = top;

  const topHtml = lead
    ? `<section class="home-top" aria-label="${esc(L.topStories)}">
         <div>${Card(lead, paper, 'lead')}</div>
         <div class="top-list">${rest.map((a) => Card(a, paper, 'h')).join('')}</div>
       </section>`
    : '';

  const latest = data.articles;
  const latestHtml = `<aside class="latest" aria-label="${esc(L.latest)}">
      ${blockTitle(L.latest)}<ol>${latest.map((a) => LatestItem(a, paper)).join('')}</ol></aside>`;

  // One block per section that actually has stories (layout adapts to the source data).
  const blocks = data.sections
    .map((s) => {
      const items = data.articles.filter((a) => a.section === s.id && !topIds.has(a.id));
      if (!items.length) return '';
      const more = data.articles.filter((a) => a.section === s.id).length > 4
        ? `<button type="button" data-section="${esc(s.id)}">${esc(L.viewAll)}</button>` : '';
      return `<section class="block" aria-label="${esc(s.label)}">
        ${blockTitle(s.label, more)}
        <div class="grid">${items.slice(0, 4).map((a) => Card(a, paper, 'v')).join('')}</div></section>`;
    })
    .join('');

  return `<div class="home">${topHtml}${latestHtml}<div class="home-sections">${blocks}</div></div>`;
}

export function SectionView(data, paper, sectionId, shown) {
  const L = t(paper.language);
  const sec = data.sections.find((s) => s.id === sectionId);
  const items = data.articles.filter((a) => a.section === sectionId);
  if (!items.length) return StateView('📰', sec?.label || '', L.empty);
  const list = items.slice(0, shown);
  const [lead, ...rest] = list;
  return `<section class="view-section">
    <h1 class="page-title">${esc(sec?.label || '')}</h1>
    <div class="home-top">
      <div>${Card(lead, paper, 'lead')}</div>
      <div class="top-list">${rest.slice(0, 4).map((a) => Card(a, paper, 'h')).join('')}</div>
    </div>
    <div class="grid">${rest.slice(4).map((a) => Card(a, paper, 'v')).join('')}</div>
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
  return `<section class="view-section">
    <h1 class="page-title">${esc(L.results(hits.length, query))}</h1>
    <div class="grid">${hits.slice(0, shown).map((a) => Card(a, paper, 'v')).join('')}</div>
    ${hits.length > shown ? `<div class="more"><button class="btn primary" type="button" data-more>${esc(L.loadMore)}</button></div>` : ''}
  </section>`;
}

export function StateView(icon, title, body, retryLabel) {
  return `<div class="state"><div class="big" aria-hidden="true">${icon}</div><h2>${esc(title)}</h2><p>${esc(body)}</p>
    ${retryLabel ? `<button class="btn primary" type="button" data-retry>${esc(retryLabel)}</button>` : ''}</div>`;
}

export function LoadingView() {
  const line = (c = '') => `<div class="skel skel-line ${c}"></div>`;
  const small = `<div>${line('big')}${line('w85')}${line('w60')}</div>`;
  return `<div class="home" aria-busy="true" aria-label="Loading">
    <section class="home-top">
      <div><div class="skel skel-lead"></div>${line('big')}${line('w85')}${line()}</div>
      <div>${small}<br>${small}<br>${small}</div>
    </section>
    <aside class="latest">${small}<br>${small}<br>${small}</aside>
    <div class="home-sections"><section class="block"><div class="grid">
      ${[1, 2, 3, 4].map(() => `<div><div class="skel skel-lead"></div>${line('big')}${line('w60')}</div>`).join('')}
    </div></section></div></div>`;
}

export { PAGE };

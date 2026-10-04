import { fetchNewspapers, fetchNews, fetchAll } from './api.js';
import { esc, safeHref, formatToday, relativeTime, debounce } from './util.js';
import { t } from './i18n.js';
import { FeedView, SearchView, StateView, LoadingView, PAGE } from './components/views.js';

const $ = (id) => document.getElementById(id);
const el = { papers: $('papers'), sections: $('sections'), view: $('view'), toolbar: $('toolbar'), notice: $('notice'),
  today: $('today'), searchbar: $('searchbar'), searchToggle: $('searchToggle'), searchInput: $('searchInput'),
  searchForm: $('searchForm'), searchClear: $('searchClear'), content: $('content') };

const AUTO_REFRESH_MS = 5 * 60 * 1000;
// Virtual "newspaper" for the landing page: every real newspaper merged into one feed.
const ALL = { id: 'all', name: 'All sources', nativeName: 'All sources', language: 'en', monogram: 'All', brandColor: '#108894', logo: null };

const state = {
  papers: [], active: null, section: 'all', query: '', shown: PAGE,
  group: 'time',  // landing page layout: 'time' (one merged list) | 'source' (a block per newspaper)
  sectionMeta: [], failed: [], // canonical section labels; names of papers that failed to load
  data: {},      // newspaper id -> latest API response
  loading: false, refreshing: false, error: null, notice: '', token: 0,
};

const paper = () => state.papers.find((p) => p.id === state.active);
const data = () => state.data[state.active];
const lang = () => paper()?.language || 'en';

// Merge every loaded newspaper into the landing-page dataset (newest first, canonical English categories).
function buildAll() {
  const papers = state.papers.filter((p) => p.id !== 'all' && state.data[p.id]);
  const label = Object.fromEntries(state.sectionMeta.map((s) => [s.id, s.label.en]));
  const articles = papers
    .flatMap((p) => state.data[p.id].articles.map((a) => ({ ...a, category: label[a.section] || a.category })))
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  const counts = new Map();
  for (const a of articles) counts.set(a.section, (counts.get(a.section) || 0) + 1);
  return {
    newspaper: 'all', language: 'en', papers, papersById: Object.fromEntries(papers.map((p) => [p.id, p])),
    articles,
    sections: state.sectionMeta.filter((s) => counts.has(s.id)).map((s) => ({ id: s.id, label: s.label.en, count: counts.get(s.id) })),
    fetchedAt: papers.map((p) => state.data[p.id].fetchedAt).sort()[0] || new Date().toISOString(), // oldest = honest "last updated"
    stale: papers.some((p) => state.data[p.id].stale),
  };
}

// Fetch every newspaper in one request; one failing paper doesn't hide the others.
async function fetchEverything(refresh) {
  const res = await fetchAll({ refresh });
  for (const [id, r] of Object.entries(res.results)) if (r) state.data[id] = r;
  state.failed = state.papers.filter((p) => res.errors?.[p.id]).map((p) => p.name);
  if (!Object.values(res.results).some(Boolean)) throw new Error('Nothing loaded');
  return buildAll();
}

// Colour each source name with its newspaper's colour (set via CSSOM: inline styles are blocked by our CSP).
function applyBrandColors() {
  document.querySelectorAll('[data-brand]').forEach((n) => {
    if (/^#[0-9a-f]{3,8}$/i.test(n.dataset.brand)) n.style.setProperty('--c', n.dataset.brand);
  });
}

/* ---------- routing: #/<newspaper>/<section> ---------- */
function readHash() {
  const [id, section] = location.hash.replace(/^#\/?/, '').split('/');
  return { id: state.papers.some((p) => p.id === id) ? id : null, section: section || 'all' };
}
function writeHash() {
  const h = `#/${state.active}${state.section !== 'all' ? '/' + state.section : ''}`;
  if (location.hash !== h) history.replaceState(null, '', h);
}

/* ---------- rendering ---------- */
function renderPapers() {
  el.papers.innerHTML = state.papers.map((p) => {
    const sel = p.id === state.active;
    const badge = p.logo ? `<img src="${esc(p.logo)}" alt="">` : esc(p.monogram);
    const sub = p.nativeName !== p.name ? `<small>${esc(p.nativeName)}</small>` : '';
    return `<button class="paper" role="tab" type="button" data-paper="${esc(p.id)}" aria-selected="${sel}" tabindex="${sel ? 0 : -1}">
      <span class="badge" aria-hidden="true">${badge}</span><span class="pname">${esc(p.name)}${sub}</span></button>`;
  }).join('');
  // Set per-paper colour through CSSOM (inline style attributes are blocked by our CSP).
  el.papers.querySelectorAll('.paper').forEach((b, i) => { // (paper tabs)
    const c = state.papers[i].brandColor;
    b.style.setProperty('--paper-color', /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#333');
  });
}

function renderSections() {
  const d = data(); const L = t(lang());
  if (!d) { el.sections.innerHTML = ''; return; }
  const tab = (id, label) => `<button class="sec-tab" type="button" data-section="${esc(id)}" ${state.section === id && !state.query ? 'aria-current="true"' : ''}>${esc(label)}</button>`;
  el.sections.innerHTML = tab('all', L.all) + d.sections.map((s) => tab(s.id, s.label)).join('');
}

const refreshIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>';

function renderToolbar() {
  const p = paper(); const d = data(); const L = t(lang());
  if (!p) { el.toolbar.innerHTML = ''; return; }
  const updated = d ? `${esc(L.updated)}: <span id="updatedAgo">${esc(relativeTime(d.fetchedAt, p.language))}</span>` : '';
  el.toolbar.innerHTML = `<div class="left"><span class="src">${esc(p.name)}</span>${updated ? `<span>·</span><span>${updated}</span>` : ''}</div>
    <button class="btn ${state.refreshing ? 'spin' : ''}" type="button" data-refresh ${state.refreshing || state.loading ? 'disabled' : ''}>${refreshIcon}${esc(L.refresh)}</button>`;
}

function renderNotice() {
  const L = t(lang());
  el.notice.innerHTML = state.notice
    ? `<div class="notice" role="status"><span>${esc(state.notice)}</span><button class="btn" type="button" data-retry>${esc(L.retry)}</button></div>` : '';
}

function renderView() {
  const p = paper(); const d = data(); const L = t(lang());
  el.content.lang = p?.language || 'bn';
  el.content.className = `container lang-${p?.language || 'bn'}`;
  if (state.loading && !d) { el.view.innerHTML = LoadingView(); return; }
  if (!d) { el.view.innerHTML = StateView('⚠️', L.errorTitle, state.error || L.errorBody, L.retry); return; }
  if (state.query) el.view.innerHTML = SearchView(d, p, state.query, state.shown);
  else el.view.innerHTML = FeedView(d, p, d.sections.some((s) => s.id === state.section) ? state.section : 'all', state.shown, state.group);
  applyBrandColors();
}

// TV-style ticker: newest headlines across all loaded papers, scrolling right to left.
// Only rebuilt when the headlines change, so the scroll doesn't restart on every re-render.
let tickerSig = '';
function renderTicker() {
  const box = $('ticker'); const track = $('tickerTrack');
  const items = state.papers
    .filter((p) => p.id !== 'all' && state.data[p.id])
    .flatMap((p) => state.data[p.id].articles.map((a) => ({ a, p })))
    .sort((x, y) => (y.a.publishedAt || '').localeCompare(x.a.publishedAt || ''))
    .slice(0, 20);
  box.hidden = !items.length;
  if (!items.length) return;
  const sig = items.map((x) => x.a.url).join('|');
  if (sig === tickerSig) return;
  tickerSig = sig;
  const set = items.map(({ a, p }) => `<a class="tick" href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="tick-src">${esc(p.name)}</span><span class="tick-title" lang="${esc(p.language)}">${esc(a.title)}</span></a>`).join('');
  track.innerHTML = `<div class="tick-set">${set}</div><div class="tick-set" aria-hidden="true">${set.replace(/<a /g, '<a tabindex="-1" ')}</div>`;
  const chars = items.reduce((n, x) => n + x.a.title.length + x.p.name.length + 8, 0);
  track.style.setProperty('--dur', `${Math.max(40, Math.round(chars * 0.13))}s`); // ≈60px/s whatever the length
}

function renderAll() {
  const p = paper();
  el.today.textContent = formatToday(lang());
  el.searchInput.placeholder = t(lang()).search;
  renderPapers(); renderSections(); renderToolbar(); renderNotice(); renderView(); renderTicker();
}

/* ---------- data loading ---------- */
async function load(id, { refresh = false, silent = false } = {}) {
  const token = ++state.token; // ignore results from superseded requests (fast switching)
  const hadData = !!state.data[id];
  state.error = null;
  if (!silent) {
    if (hadData) state.refreshing = refresh; else state.loading = true;
    state.notice = '';
    renderAll();
  }
  try {
    let res;
    if (id === 'all') res = await fetchEverything(refresh);
    else res = await fetchNews(id, { refresh });
    state.data[id] = res;
    if (id !== 'all' && state.data.all) state.data.all = buildAll(); // keep the landing page in sync
    if (token === state.token && id === state.active) {
      state.notice = id === 'all' && state.failed.length
        ? `Couldn't load ${state.failed.join(', ')}. Showing the rest.`
        : res.stale ? t(lang()).staleNotice : '';
    }
  } catch (err) {
    if (token === state.token && id === state.active && !silent) {
      state.error = hadData ? null : t(lang()).errorBody;
      if (hadData) state.notice = t(lang()).staleNotice;
    }
  } finally {
    if (token === state.token) { state.loading = false; state.refreshing = false; if (id === state.active) renderAll(); }
  }
}

function selectPaper(id, section = 'all') {
  if (!id) return;
  state.active = id; state.section = section; state.shown = PAGE; state.notice = '';
  writeHash();
  const cached = state.data[id];
  const stale = !cached || Date.now() - new Date(cached.fetchedAt).getTime() > AUTO_REFRESH_MS;
  if (stale) { load(id); } // load() renders (skeleton, or cached content + refreshing state)
  else {
    state.token++; state.loading = false; state.refreshing = false; // supersede any in-flight request
    renderAll();
  }
  el.papers.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function setSection(id) {
  state.section = id; state.shown = PAGE; state.query = ''; el.searchInput.value = ''; el.searchClear.hidden = true;
  writeHash(); renderSections(); renderView();
  scrollTo({ top: 0 });
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-paper],[data-section],[data-refresh],[data-retry],[data-more],[data-group]');
  if (!target) return;
  if (target.dataset.paper) selectPaper(target.dataset.paper);
  else if (target.dataset.section) setSection(target.dataset.section);
  else if (target.hasAttribute('data-refresh')) load(state.active, { refresh: true });
  else if (target.hasAttribute('data-retry')) load(state.active, { refresh: true });
  else if (target.hasAttribute('data-more')) { state.shown += PAGE; renderView(); }
  else if (target.dataset.group) { state.group = target.dataset.group; state.shown = PAGE; renderView(); }
});

// Arrow-key navigation across newspaper tabs
el.papers.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const i = state.papers.findIndex((p) => p.id === state.active);
  const next = state.papers[(i + (e.key === 'ArrowRight' ? 1 : -1) + state.papers.length) % state.papers.length];
  selectPaper(next.id);
  el.papers.querySelector('[aria-selected="true"]')?.focus();
});

$('brand').addEventListener('click', (e) => { e.preventDefault(); state.query = ''; el.searchInput.value = ''; selectPaper('all'); scrollTo({ top: 0 }); });

function toggleSearch(open = el.searchbar.hidden) {
  el.searchbar.hidden = !open;
  el.searchToggle.setAttribute('aria-expanded', String(open));
  if (open) el.searchInput.focus();
  else if (state.query) clearSearch();
}
function clearSearch() { state.query = ''; state.shown = PAGE; el.searchInput.value = ''; el.searchClear.hidden = true; renderSections(); renderView(); }
el.searchToggle.addEventListener('click', () => toggleSearch());
el.searchClear.addEventListener('click', () => { clearSearch(); el.searchInput.focus(); });
el.searchForm.addEventListener('submit', (e) => e.preventDefault());
el.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleSearch(false); });
el.searchInput.addEventListener('input', debounce(() => {
  state.query = el.searchInput.value.trim(); state.shown = PAGE;
  el.searchClear.hidden = !el.searchInput.value;
  renderSections(); renderView();
}, 150));

window.addEventListener('hashchange', () => {
  const { id, section } = readHash();
  if (id && (id !== state.active || section !== state.section)) { if (id !== state.active) selectPaper(id, section); else setSection(section); }
});

/* ---------- theme: one click cycles Light → Dark → Forest (choice is remembered) ---------- */
const themeBtn = $('themeToggle');
const THEMES = ['light', 'dark', 'forest'];
const THEME_NAMES = { light: 'Light', dark: 'Dark', forest: 'Forest' };
const THEME_COLOR = { light: '#E2F4F0', dark: '#04222B', forest: '#111A12' }; // browser UI colour on phones
const currentTheme = () => document.documentElement.dataset.theme
  || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function syncThemeButton() {
  const cur = currentTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  themeBtn.setAttribute('aria-label', `Theme: ${THEME_NAMES[cur]}. Switch to ${THEME_NAMES[next]}`);
  themeBtn.title = `${THEME_NAMES[cur]} theme — click for ${THEME_NAMES[next]}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[cur]);
}
themeBtn.addEventListener('click', () => { // one click = next theme: Light → Dark → Forest → Light
  const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* private mode: still works for this visit */ }
  syncThemeButton();
});
syncThemeButton();

/* ---------- freshness ---------- */
setInterval(() => { // keep "Last updated: x min ago" and card times honest
  const d = data(); const ago = $('updatedAgo');
  if (d && ago) ago.textContent = relativeTime(d.fetchedAt, lang());
}, 30000);

function autoRefresh() {
  const d = data();
  if (document.visibilityState === 'visible' && d && !state.loading && !state.refreshing &&
      Date.now() - new Date(d.fetchedAt).getTime() > AUTO_REFRESH_MS) load(state.active, { refresh: true, silent: true });
}
setInterval(autoRefresh, 60000);
document.addEventListener('visibilitychange', autoRefresh);

/* ---------- boot ---------- */
(async function init() {
  el.view.innerHTML = LoadingView();
  try {
    const cfg = await fetchNewspapers();
    state.sectionMeta = cfg.sections;
    state.papers = [ALL, ...cfg.newspapers];
    const { id, section } = readHash();
    selectPaper(id || 'all', id ? section : 'all'); // landing page by default
  } catch {
    el.view.innerHTML = StateView('⚠️', t('en').errorTitle, t('en').errorBody, t('en').retry);
    el.view.querySelector('[data-retry]').addEventListener('click', () => location.reload());
  }
})();

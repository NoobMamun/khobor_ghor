// Thin client for our own backend. The browser never talks to newspaper sites
// directly (CORS, caching and sanitising all happen server-side).
async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const fetchNewspapers = () => getJson('/api/newspapers');
export const fetchNews = (id, { refresh = false } = {}) =>
  getJson(`/api/news/${encodeURIComponent(id)}${refresh ? '?refresh=1' : ''}`);
export const fetchAll = ({ refresh = false } = {}) => getJson(`/api/news${refresh ? '?refresh=1' : ''}`);

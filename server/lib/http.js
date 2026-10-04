export const USER_AGENT =
  'BDNewsPortal/1.0 (news aggregator; links back to original articles; +contact via site owner)';

// Polite fetch: timeout, size cap, identifying User-Agent.
export async function fetchText(url, { timeout = 10000, maxBytes = 4_000_000, accept } = {}) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: { 'User-Agent': USER_AGENT, Accept: accept || '*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  // Read at most maxBytes (stops early for big pages when we only need <head>).
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks).toString('utf8');
}

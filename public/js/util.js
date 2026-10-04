const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
// Everything that comes from a feed goes through esc() before touching the DOM.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const safeHref = (u) => (/^https?:\/\//i.test(u) ? esc(u) : '#');

const locale = (lang) => (lang === 'bn' ? 'bn-BD' : 'en-GB');

export function formatToday(lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka',
  }).format(new Date());
}

export function relativeTime(iso, lang, now = Date.now()) {
  if (!iso) return '';
  const diff = (new Date(iso).getTime() - now) / 1000; // negative = past
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(iso));
}

export function fullDate(iso, lang) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(new Date(iso));
}

// Case/diacritic-insensitive matching that is safe for Bangla (NFC only; no accent folding on Bangla).
export const norm = (s) => String(s ?? '').normalize('NFC').toLowerCase();

export const debounce = (fn, ms) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

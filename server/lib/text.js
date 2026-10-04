import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

// Collect the text of a parsed XML node (strings, {#text}, nested elements).
export function textOf(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'object') {
    return Object.entries(node)
      .filter(([k]) => !k.startsWith('@_'))
      .map(([, v]) => textOf(v))
      .join(' ');
  }
  return '';
}

// Untrusted HTML/markup -> plain text. All tags are stripped, entities decoded.
// The frontend additionally escapes everything it renders.
export function toPlainText(input, maxLen) {
  const stripped = sanitizeHtml(String(input ?? ''), {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  });
  let text = decodeHTML(stripped).replace(/\s+/g, ' ').trim();
  if (maxLen && text.length > maxLen) {
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    text = (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\s-]+$/, '') + '…';
  }
  return text;
}

// Only absolute http(s) URLs survive; everything else (javascript:, data:, ...) is dropped.
export function safeUrl(input, base) {
  if (!input) return null;
  try {
    const u = new URL(String(input).trim(), base);
    if (u.protocol === 'http:') u.protocol = 'https:';
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

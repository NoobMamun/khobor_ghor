import { Parser } from 'htmlparser2';

// Keep only the text of an HTML fragment: tags are dropped, script/style contents are
// discarded, entities decoded once. (htmlparser2 is ESM-only-safe on every Node runtime.)
const SKIP = new Set(['script', 'style', 'noscript', 'textarea', 'option']);
const BREAKS = new Set(['br', 'p', 'div', 'li', 'h1', 'h2', 'h3']);
function stripTags(html) {
  let out = '';
  let skipDepth = 0;
  const parser = new Parser(
    {
      onopentag(name) {
        if (SKIP.has(name)) skipDepth++;
        else if (BREAKS.has(name)) out += ' ';
      },
      onclosetag(name) {
        if (SKIP.has(name) && skipDepth) skipDepth--;
      },
      ontext(text) {
        if (!skipDepth) out += text;
      },
    },
    { decodeEntities: true },
  );
  parser.write(html);
  parser.end();
  return out;
}

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
  let text = stripTags(String(input ?? '')).replace(/\s+/g, ' ').trim();
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

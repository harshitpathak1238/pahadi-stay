import sanitizeHtml from 'sanitize-html';

const namedEntities: Record<string, string> = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: '\u00a0', quot: '"' };

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[\da-f]+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, code: string) => {
    const normalized = code.toLowerCase();
    if (normalized in namedEntities) return namedEntities[normalized];
    const radix = normalized.startsWith('#x') ? 16 : 10;
    const number = Number.parseInt(normalized.replace(/^#x?/, ''), radix);
    return Number.isNaN(number) ? entity : String.fromCodePoint(number);
  });
}

function decodeStoredMarkup(html: string) {
  const decoded = decodeHtmlEntities(html);
  if (/<[a-z][^>]*[\s>]/i.test(decoded)) return decoded;
  const doubleDecoded = decodeHtmlEntities(decoded);
  return /<[a-z][^>]*[\s>]/i.test(doubleDecoded) ? doubleDecoded : html;
}

function extractBody(html: string) {
  const trimmed = decodeStoredMarkup(html).trim();
  const body = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1];
  const document = trimmed.match(/<html\b[^>]*>([\s\S]*?)<\/html>/i);
  return document ? document[1].replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '') : trimmed;
}

function sanitizationOptions() {
  return {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'section', 'article', 'main', 'header', 'footer', 'nav', 'div', 'span', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'title'], '*': ['class', 'id'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { img: ['http', 'https'] },
  };
}

export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(extractBody(html), sanitizationOptions());
}

export function normalizeBlogHtml(html: string) {
  return sanitizeBlogHtml(extractBody(html));
}

export function isFullBlogDocument(html: string) {
  const decoded = decodeStoredMarkup(html);
  return /<!doctype\s+html|<html\b|<body\b/i.test(decoded);
}

export function getFullBlogDocument(html: string) {
  const decoded = decodeStoredMarkup(html).trim();
  const body = decoded.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || extractBody(decoded);
  const styles = [...decoded.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]).join('\n')
    .replace(/<\/?style\b[^>]*>/gi, '')
    .replace(/@import\s+[^;]+;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript:[^)]*\)/gi, '');
  return { content: sanitizeHtml(body, sanitizationOptions()), styles };
}
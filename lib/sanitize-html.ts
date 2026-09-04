import sanitizeHtml from 'sanitize-html';

function extractBody(html: string) {
  const trimmed = html.trim();
  const body = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1];
  const document = trimmed.match(/<html\b[^>]*>([\s\S]*?)<\/html>/i);
  return document ? document[1].replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '') : trimmed;
}

export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'section', 'article', 'header', 'footer', 'div', 'span', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'title'], '*': ['class', 'id'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { img: ['http', 'https'] },
  });
}

export function normalizeBlogHtml(html: string) {
  return sanitizeBlogHtml(extractBody(html));
}
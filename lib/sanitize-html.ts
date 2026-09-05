import sanitizeHtml from 'sanitize-html';

export function isFullBlogDocument(html: string) {
  return /<!doctype\s+html|<html[\s>]|<body[\s>]|<(article|section|header|main|div|table|style)\b/i.test(html);
}

export function getFullBlogDocument(html: string) {
  const trimmed = html.trim();
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const htmlMatch = trimmed.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : htmlMatch ? htmlMatch[1] : trimmed;
  const styles = [...trimmed.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1])
    .join('\n');
  const content = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '')
    .trim();
  return { content, styles };
}

export function normalizeBlogHtml(html: string) {
  return isFullBlogDocument(html) ? getFullBlogDocument(html).content : html;
}

export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span', 'iframe'],
    allowedAttributes: { a: ['href', 'target', 'rel', 'class'], img: ['src', 'alt', 'title', 'class'], div: ['class'], span: ['class'], table: ['class'], th: ['colspan', 'rowspan', 'class'], td: ['colspan', 'rowspan', 'class'], iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'class'] },
    allowedClasses: { '*': ['cta-box', 'cta-btn', 'responsive-image', 'video-embed'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { img: ['http', 'https'] },
  });
}
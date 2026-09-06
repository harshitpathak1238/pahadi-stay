import sanitizeHtml from 'sanitize-html';
import { parse, parseFragment, serializeOuter, type DefaultTreeAdapterTypes } from 'parse5';

type ParsedNode = DefaultTreeAdapterTypes.Node;
type ParsedParentNode = DefaultTreeAdapterTypes.ParentNode;

function findNode(node: ParsedNode, nodeName: string): ParsedNode | null {
  if (node.nodeName === nodeName) return node;
  if ('childNodes' in node) {
    for (const child of node.childNodes) {
      const match = findNode(child, nodeName);
      if (match) return match;
    }
  }
  return null;
}

function findNodes(node: ParsedNode, nodeName: string): ParsedNode[] {
  const matches = node.nodeName === nodeName ? [node] : [];
  if (!('childNodes' in node)) return matches;
  return matches.concat(...node.childNodes.map((child) => findNodes(child, nodeName)));
}

function textContent(node: ParsedNode): string {
  return 'childNodes' in node ? node.childNodes.map(textContent).join('') : 'value' in node ? node.value : '';
}

function asParentNode(node: ParsedNode | null): ParsedParentNode | null {
  return node && 'childNodes' in node ? node : null;
}

export function isFullBlogDocument(html: string) {
  return /<!doctype\s+html|<html[\s>]/i.test(html);
}

export function getFullBlogDocument(html: string) {
  const hasDocumentWrapper = /<!doctype\s+html|<html[\s>]|<body[\s>]|<head[\s>]/i.test(html);
  const document = hasDocumentWrapper ? parse(html) : parseFragment(html);
  const body = hasDocumentWrapper ? asParentNode(findNode(document, 'body')) : null;
  const htmlNode = hasDocumentWrapper ? asParentNode(findNode(document, 'html')) : null;
  const contentRoot = body || htmlNode || document;
  const content = (contentRoot.childNodes || [])
    .filter((node) => node.nodeName !== 'script' && node.nodeName !== 'head' && node.nodeName !== 'style')
    .map((node) => serializeOuter(node))
    .join('')
    .trim();
  const styles = findNodes(document, 'style').map(textContent).join('\n');
  return { content, styles };
}

export function normalizeBlogHtml(html: string) {
  return isFullBlogDocument(html) ? getFullBlogDocument(html).content : html;
}

export function sanitizeBlogHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'div', 'span', 'iframe'],
    allowedAttributes: { a: ['href', 'target', 'rel', 'class'], img: ['src', 'alt', 'title', 'class', 'width', 'height', 'style'], div: ['class', 'style'], span: ['class', 'style'], table: ['class'], th: ['colspan', 'rowspan', 'class'], td: ['colspan', 'rowspan', 'class'], iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'class'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { img: ['http', 'https'] },
  });
}
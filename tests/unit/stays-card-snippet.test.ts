import { describe, expect, it } from 'vitest';
import { cardDescriptionSnippet, isFullBlogDocument } from '../../lib/sanitize-html';

const fullDocument = `<!doctype html><html><head><style>.amenities-container { display: flex; font-family: -apple-system, #173f35 }</style></head><body><p>Full body for the detail page iframe.</p></body></html>`;

describe('listing card description snippets', () => {
  it('detects full HTML documents the same way the detail page does', () => {
    expect(isFullBlogDocument(fullDocument)).toBe(true);
    expect(isFullBlogDocument('<p>plain snippet</p>')).toBe(false);
  });

  it('never renders a full HTML document as card text', () => {
    expect(cardDescriptionSnippet(fullDocument)).toBe('');
  });

  it('strips style/script blocks, tags, and entities from partial HTML', () => {
    const partial = '<div class="meta"><style>.tag { color: #24584a; }</style>Cozy <strong>lake-view</strong> stay &amp; home-cooked meals&nbsp;near Bhimtal.</div>';
    expect(cardDescriptionSnippet(partial)).toBe('Cozy lake-view stay & home-cooked meals near Bhimtal.');
  });

  it('removes citation-style artifacts like [1], [2]', () => {
    expect(cardDescriptionSnippet('A peaceful retreat. [1] [2] With mountain views.')).toBe('A peaceful retreat. With mountain views.');
  });

  it('truncates long snippets to ~120 characters with an ellipsis', () => {
    const long = 'word '.repeat(60).trim();
    const snippet = cardDescriptionSnippet(long);
    expect(snippet.length).toBeLessThanOrEqual(120);
    expect(snippet.endsWith('...')).toBe(true);
  });

  it('returns empty for empty input', () => {
    expect(cardDescriptionSnippet('')).toBe('');
  });
});
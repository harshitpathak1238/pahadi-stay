import { describe, expect, it } from 'vitest';
import { getFullBlogDocument, isFullBlogDocument, normalizeBlogHtml, sanitizeBlogHtml } from '../../lib/sanitize-html';

const fullDocument = `<!doctype html><html><head><style>.category{color:red}</style></head><body><article><span class="category">Design &amp; Tech</span><div class="meta">Published on 2026-09-06</div><blockquote>Keep the structure.</blockquote><div class="tag-container"><span class="tag">HTML</span><span class="tag">Semantic Web</span></div><h2>1. The Power of Semantic HTML</h2></article></body></html>`;

describe('blog editor HTML preservation', () => {
  it('detects only complete HTML documents for raw iframe mode', () => {
    expect(isFullBlogDocument(fullDocument)).toBe(true);
    expect(isFullBlogDocument('<div class="highlight-box">Rich text</div>')).toBe(false);
  });

  it('removes only the document wrapper while retaining custom content elements', () => {
    const html = normalizeBlogHtml(fullDocument);
    expect(html).toContain('<span class="category">Design &amp; Tech</span>');
    expect(html).toContain('<div class="meta">Published on 2026-09-06</div>');
    expect(html).toContain('<div class="tag-container"><span class="tag">HTML</span><span class="tag">Semantic Web</span></div>');
    expect(html).toContain('<h2>1. The Power of Semantic HTML</h2>');
    expect(html).not.toContain('<style>');
    expect(html).not.toContain('<!doctype');
  });

  it('extracts document styles separately from body content', () => {
    const result = getFullBlogDocument(fullDocument);
    expect(result.styles).toContain('.category{color:red}');
    expect(result.content).not.toContain('<style>');
  });

  it('preserves unrelated arbitrary div and span classes without code changes', () => {
    const html = normalizeBlogHtml('<div class="highlight-box" style="padding:12px"><span class="badge-new" style="color:green">New</span><div class="nested-layout"><span class="unpredictable-label">Field</span></div></div>');
    expect(html).toBe('<div class="highlight-box" style="padding:12px"><span class="badge-new" style="color:green">New</span><div class="nested-layout"><span class="unpredictable-label">Field</span></div></div>');
    const saved = sanitizeBlogHtml(html);
    expect(saved).toContain('class="highlight-box"');
    expect(saved).toContain('class="badge-new"');
    expect(saved).toContain('class="nested-layout"');
    expect(saved).toContain('class="unpredictable-label"');
  });

  it('keeps arbitrary classes and resized image dimensions when saving', () => {
    const html = sanitizeBlogHtml('<span class="category">Design &amp; Tech</span><div class="meta" style="color:red">Published</div><img src="https://example.com/image.webp" class="hero" width="640" height="360" style="width:640px;height:360px">');
    expect(html).toContain('class="category"');
    expect(html).toContain('class="meta"');
    expect(html).toContain('style="color:red"');
    expect(html).toContain('class="hero"');
    expect(html).toContain('width="640"');
    expect(html).toContain('height="360"');
    expect(html).toContain('style="width:640px;height:360px"');
  });
});

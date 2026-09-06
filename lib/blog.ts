import type { BlogPost } from '@prisma/client';
import { db } from '@/lib/db';
import { normalizeBlogHtml, sanitizeBlogCss } from '@/lib/sanitize-html';

type BlogPostWithCustomCss = BlogPost & { customCss?: string | null };
export type PublishedBlog = Omit<BlogPost, 'tags' | 'createdAt' | 'updatedAt'> & { customCss: string | null; tags: string[]; createdAt: Date | null; updatedAt: Date | null };

export function renderBlogDocument(body: string, customCss: string | null) {
  const css = sanitizeBlogCss(customCss || '').replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${normalizeBlogHtml(body)}</body></html>`;
}

export function normalizeBlogImageSources(html: string): string {
  const apiUrl = process.env.HOSTINGER_MEDIA_API_URL?.replace(/\/$/, '');
  if (!apiUrl) return html;
  const apiOrigin = new URL(apiUrl).origin;

  return html.replace(/(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']+)\2/gi, (match, prefix, quote, source) => {
    let filename: string | null = null;
    try {
      const parsed = new URL(source, apiOrigin);
      if (parsed.pathname.endsWith('/media-api.php')) filename = parsed.searchParams.get('file');
      else if (parsed.pathname.includes('/uploads/images/')) filename = parsed.pathname.split('/').pop() || null;
    } catch {
      filename = null;
    }
    if (!filename && /^[a-f0-9-]+\.(?:jpg|png|webp|mp4|mov)$/i.test(source)) filename = source;
    if (!filename || !/^[a-f0-9-]+\.(?:jpg|png|webp|mp4|mov)$/i.test(filename)) return match;
    return `${prefix}${quote}${apiUrl}?file=${encodeURIComponent(filename)}${quote}`;
  });
}

function normalizeBlog(post: BlogPost): PublishedBlog {
  const tags = Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  return { ...post, customCss: (post as BlogPostWithCustomCss).customCss ?? null, tags };
}

export async function getPublishedBlogs(): Promise<PublishedBlog[]> {
  try {
    return (await db.blogPost.findMany({ where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' } })).map(normalizeBlog);
  } catch (error) {
    console.error('Published blogs unavailable:', error);
    return [];
  }
}

export async function getPublishedBlog(slug: string): Promise<PublishedBlog | null> {
  try {
    const post = await db.blogPost.findFirst({ where: { slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } } });
    return post ? normalizeBlog(post) : null;
  } catch (error) {
    console.error(`Published blog unavailable for ${slug}:`, error);
    return null;
  }
}

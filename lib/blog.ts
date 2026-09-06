import type { BlogPost } from '@prisma/client';
import { db } from '@/lib/db';

export type PublishedBlog = Omit<BlogPost, 'tags' | 'createdAt' | 'updatedAt'> & { tags: string[]; createdAt: Date | null; updatedAt: Date | null };

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
  return { ...post, tags };
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

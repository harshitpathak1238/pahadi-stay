import type { BlogPost } from '@prisma/client';
import { db } from '@/lib/db';

export type PublishedBlog = Omit<BlogPost, 'tags' | 'createdAt' | 'updatedAt'> & { tags: string[]; createdAt: Date | null; updatedAt: Date | null };

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

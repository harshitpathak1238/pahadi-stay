import type { BlogPost } from '@prisma/client';
import { db } from '@/lib/db';
import { blogArticles } from '@/lib/blog-data';

export type PublishedBlog = Omit<BlogPost, 'tags' | 'createdAt' | 'updatedAt'> & { tags: string[]; createdAt: Date | null; updatedAt: Date | null };

function normalizeBlog(post: BlogPost): PublishedBlog {
  const tags = Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  return { ...post, tags };
}

export async function getPublishedBlogs(): Promise<PublishedBlog[]> {
  try {
    return (await db.blogPost.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } })).map(normalizeBlog);
  } catch { /* Keep the public journal available before the blog migration is applied. */ }
  return blogArticles.map((article) => ({ id: article.slug, slug: article.slug, title: article.title, metaTitle: article.title, metaDescription: article.excerpt, excerpt: article.excerpt, body: article.content.join('\n\n'), authorName: 'KainchiDarshan Editorial Team', category: article.category, primaryKeyword: article.keyword, tags: [article.keyword], featuredImage: null, imageAltText: null, status: 'PUBLISHED' as const, publishedAt: null, createdAt: null, updatedAt: null } as PublishedBlog));
}

export async function getPublishedBlog(slug: string): Promise<PublishedBlog | null> {
  try {
    const post = await db.blogPost.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (post) return normalizeBlog(post);
  } catch { /* Use the static article until the database is ready. */ }
  const article = blogArticles.find((item) => item.slug === slug);
  return article ? { id: article.slug, slug: article.slug, title: article.title, metaTitle: article.title, metaDescription: article.excerpt, excerpt: article.excerpt, body: article.content.join('\n\n'), authorName: 'KainchiDarshan Editorial Team', category: article.category, primaryKeyword: article.keyword, tags: [article.keyword], featuredImage: null, imageAltText: null, status: 'PUBLISHED' as const, publishedAt: null, createdAt: null, updatedAt: null } as PublishedBlog : null;
}

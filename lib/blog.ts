import { db } from '@/lib/db';
import { blogArticles } from '@/lib/blog-data';

export async function getPublishedBlogs() {
  try {
    return await db.blogPost.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' } });
  } catch { /* Keep the public journal available before the blog migration is applied. */ }
  return blogArticles.map((article) => ({ ...article, metaTitle: article.title, metaDescription: article.excerpt, body: article.content.join('\n\n'), authorName: 'KainchiDarshan Editorial Team', category: article.category, primaryKeyword: article.keyword, tags: [article.keyword], featuredImage: null, imageAltText: null, status: 'PUBLISHED' as const, publishedAt: null, updatedAt: null }));
}

export async function getPublishedBlog(slug: string) {
  try {
    const post = await db.blogPost.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (post) return post;
  } catch { /* Use the static article until the database is ready. */ }
  const article = blogArticles.find((item) => item.slug === slug);
  return article ? { ...article, metaTitle: article.title, metaDescription: article.excerpt, body: article.content.join('\n\n'), authorName: 'KainchiDarshan Editorial Team', primaryKeyword: article.keyword, tags: [article.keyword], featuredImage: null, imageAltText: null, status: 'PUBLISHED' as const, publishedAt: null, updatedAt: null } : null;
}

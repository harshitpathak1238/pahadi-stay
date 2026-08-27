import type { MetadataRoute } from 'next';
import { getPublishedBlogs } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const blogs = await getPublishedBlogs();
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...blogs.map((blog) => ({ url: `${baseUrl}/blog/${blog.slug}`, lastModified: blog.updatedAt || blog.publishedAt || undefined, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}

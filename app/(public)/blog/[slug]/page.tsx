import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedBlog, getPublishedBlogs } from '@/lib/blog';

export async function generateStaticParams() { return (await getPublishedBlogs()).map((blog) => ({ slug: blog.slug })); }

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getPublishedBlog(params.slug);
  if (!blog) return { title: 'Kumaon guide' };
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return { title: blog.metaTitle, description: blog.metaDescription, keywords: blog.tags, alternates: { canonical: `${baseUrl}/blog/${blog.slug}` }, openGraph: { type: 'article', title: blog.metaTitle, description: blog.metaDescription, url: `${baseUrl}/blog/${blog.slug}`, images: blog.featuredImage ? [{ url: blog.featuredImage, alt: blog.imageAltText || blog.title }] : undefined, publishedTime: blog.publishedAt?.toISOString(), modifiedTime: blog.updatedAt?.toISOString(), authors: [blog.authorName] }, twitter: { card: 'summary_large_image', title: blog.metaTitle, description: blog.metaDescription, images: blog.featuredImage ? [blog.featuredImage] : undefined } };
}

export default async function Article({ params }: { params: { slug: string } }) {
  const blog = await getPublishedBlog(params.slug);
  if (!blog) notFound();
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: blog.title, description: blog.metaDescription, image: blog.featuredImage ? [`${baseUrl}${blog.featuredImage}`] : undefined, author: { '@type': 'Person', name: blog.authorName }, publisher: { '@type': 'Organization', name: 'KainchiDarshan' }, datePublished: blog.publishedAt?.toISOString(), dateModified: blog.updatedAt?.toISOString() || blog.publishedAt?.toISOString(), mainEntityOfPage: `${baseUrl}/blog/${blog.slug}` };

  return (
    <div className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <iframe
        title={blog.title}
        srcDoc={blog.body}
        sandbox="allow-same-origin"
        className="block min-h-[1600px] w-full border-0"
      />
    </div>
  );
}

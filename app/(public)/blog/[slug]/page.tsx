import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublishedBlog, getPublishedBlogs } from '@/lib/blog';
import { getFullBlogDocument, isFullBlogDocument, normalizeBlogHtml } from '@/lib/sanitize-html';

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
  const fullDocument = isFullBlogDocument(blog.body) ? getFullBlogDocument(blog.body) : null;
  return (
    <article className={fullDocument ? 'blog-html-document' : 'mx-auto max-w-3xl px-5 py-14 md:py-20'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {!fullDocument && <>
          <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">{blog.category} · By {blog.authorName}</p>
          <h1 className="mt-4 text-5xl leading-[1.02] text-[#173f35] md:text-6xl">{blog.title}</h1>
          <p className="mt-8 text-xl leading-8 text-[#526057]">{blog.excerpt}</p>
          {blog.featuredImage && (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image src={blog.featuredImage} alt={blog.imageAltText || blog.title} fill priority sizes="(max-width: 768px) 92vw, 768px" className="object-cover" />
            </div>
          )}
      </>}
      {fullDocument ? <>
        {fullDocument.styles && <style dangerouslySetInnerHTML={{ __html: fullDocument.styles }} />}
        <div dangerouslySetInnerHTML={{ __html: fullDocument.content }} />
      </> : <div className="prose mt-12 max-w-none sans text-base leading-8 text-[#526057]" dangerouslySetInnerHTML={{ __html: normalizeBlogHtml(blog.body) }} />}
    </article>
  );
}

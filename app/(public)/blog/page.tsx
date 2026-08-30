import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { getPublishedBlogs } from '@/lib/blog';

export const metadata = {
  title: 'Kumaon travel journal',
  description: 'Local guides, thoughtful itineraries, and the best things to do around Bhimtal and Kainchi Dham.'
};

export default async function BlogPage() {
  const blogs = await getPublishedBlogs();
  const featured = blogs[0] ?? null;
  const remaining = blogs.slice(1);

  return (
    <div className="bg-[#f7f5f0]">
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 md:pb-16 md:pt-16">
        <div className="overflow-hidden rounded-[2rem] border border-[#e5e3dc] bg-[radial-gradient(circle_at_top_left,_rgba(214,160,109,0.18),_transparent_30%),linear-gradient(135deg,#f7f4ec_0%,#eef2eb_100%)] shadow-[0_30px_80px_rgba(23,63,53,0.06)]">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-10">
            <div className="flex flex-col justify-center">
              <p className="sans inline-flex w-fit items-center gap-2 rounded-full border border-[#d9d4c8] bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[#b66b45]">
                <BookOpen size={13} /> The pahadi journal
              </p>
              <h1 className="mt-5 text-4xl leading-none text-[#173f35] md:text-6xl">Notes from the road.</h1>
              <p className="sans mt-5 max-w-xl text-base leading-7 text-[#607067] md:text-lg">
                Local knowledge for slower mornings, better stays, and more thoughtful trips through Kumaon.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#173f35]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d9d4c8] bg-white/80 px-3 py-2 sans font-medium"><MapPin size={15} className="text-[#b66b45]" /> Bhimtal & Kainchi Dham</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d9d4c8] bg-white/80 px-3 py-2 sans font-medium"><Sparkles size={15} className="text-[#b66b45]" /> Curated local guides</span>
              </div>
            </div>

            {featured ? (
              <Link href={`/blog/${featured.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-[#e1e3dc] bg-white shadow-[0_25px_55px_rgba(23,63,53,0.08)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {featured.featuredImage ? (
                    <Image src={featured.featuredImage} alt={featured.imageAltText || featured.title} fill sizes="(max-width: 768px) 85vw, 38vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#edf3ee] text-[#173f35]"> <BookOpen size={40} /> </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="sans flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b66b45]">
                    <span>{featured.category}</span>
                    <span>•</span>
                    <span>{featured.authorName}</span>
                  </div>
                  <h2 className="mt-3 text-2xl leading-tight text-[#173f35] md:text-[2rem]">{featured.title}</h2>
                  <p className="sans mt-3 line-clamp-3 text-sm leading-6 text-[#607067]">{featured.excerpt}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#24584a]">Read guide <ArrowRight size={16} /></div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-[#d8d9d2] bg-[#edf3ee] p-6 text-center sans text-[#607067]">
                New stories will appear here as soon as they are published.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:pb-24">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="sans text-[11px] font-bold uppercase tracking-[.22em] text-[#b66b45]">Fresh reading</p>
            <h2 className="mt-2 text-2xl text-[#173f35] md:text-3xl">Latest guides</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#d9d4c8] bg-white px-3 py-2 text-sm text-[#526057] sans md:flex">
            <CalendarDays size={15} className="text-[#b66b45]" /> Updated with the season
          </div>
        </div>

        {remaining.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {remaining.map((blog) => (
              <Link key={blog.slug} href={`/blog/${blog.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-[#e2e6df] bg-white shadow-[0_18px_40px_rgba(23,63,53,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_55px_rgba(23,63,53,0.08)]">
                {blog.featuredImage && (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={blog.featuredImage} alt={blog.imageAltText || blog.title} fill sizes="(max-width: 768px) 92vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="p-5">
                  <div className="sans flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b66b45]">
                    <span>{blog.category}</span>
                    <span>•</span>
                    <span>{blog.authorName}</span>
                  </div>
                  <h3 className="mt-3 text-2xl leading-tight text-[#173f35]">{blog.title}</h3>
                  <p className="sans mt-3 text-sm leading-6 text-[#607067]">{blog.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="sans text-xs font-semibold uppercase tracking-[.12em] text-[#526057]">
                      {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Fresh pick'}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#24584a]">Read <ArrowRight size={15} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#d2d8d0] bg-white p-8 text-center sans text-[#607067]">
            No stories are published yet. The journal will appear here once new travel notes are added.
          </div>
        )}
      </section>
    </div>
  );
}

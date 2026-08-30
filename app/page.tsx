import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Compass, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { SearchBox } from '@/components/SearchBox';
import { ListingCard } from '@/components/ui/ListingCard';
import { Button } from '@/components/ui/Button';
import { stays, destinations } from '@/lib/mock-data';
import { getPublishedBlogs } from '@/lib/blog';

const values = [
  { icon: Sparkles, title: 'Thoughtfully chosen', text: 'Stays and experiences we would recommend to friends.' },
  { icon: ShieldCheck, title: 'Clear from the start', text: 'Straightforward details, honest prices, no surprises.' },
  { icon: HeartHandshake, title: 'Local when it matters', text: 'A real person to help before and during your trip.' },
];

export default async function Home() {
  const blogs = (await getPublishedBlogs()).slice(0, 3);

  return (
    <>
      <section className="hero-wash px-5 text-[#f7f4ec]">
        <div className="mx-auto w-full max-w-7xl">
          <div className="hero-copy max-w-3xl">
            <p className="sans rise text-xs font-bold uppercase tracking-[.24em] text-[#e5b785]">Your next Kumaon escape</p>
            <h1 className="rise mt-5 max-w-2xl text-[3.25rem] leading-[.94] md:text-7xl lg:text-[5.8rem]">Find your quiet <i>place.</i></h1>
            <p className="sans rise mt-6 max-w-lg text-base leading-7 text-white/85 md:text-lg">Handpicked stays, easy rides, and small adventures around Bhimtal and Kainchi Dham.</p>
          </div>
          <div className="rise mt-10 md:mt-14"><SearchBox /></div>
          <div className="sans mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
            <span className="flex items-center gap-2"><Compass size={15} className="text-[#e5b785]" /> Start with a place</span>
            <Link href="/packages" className="inline-flex items-center gap-1 text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white">Browse curated packages <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 px-5">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-[#e0e6e0] bg-[#e0e6e0] shadow-[0_14px_35px_rgba(23,63,53,.1)] sm:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => <div key={title} className="bg-white px-5 py-5 sm:px-6"><Icon size={21} strokeWidth={1.8} className="text-[#b66b45]" /><h3 className="mt-3 text-base font-semibold text-[#173f35]">{title}</h3><p className="sans mt-1 text-xs leading-5 text-[#6c7770]">{text}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="flex flex-col gap-5 border-b border-[#dfe2d8] pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">A good place to begin</p>
            <h2 className="mt-3 max-w-xl text-3xl leading-tight md:text-5xl">Stays with room to breathe.</h2>
          </div>
          <Button href="/stays" variant="quiet">See all stays <ArrowRight size={16} /></Button>
        </div>
        <div className="mt-9 grid gap-9 md:grid-cols-3 md:gap-7">{stays.map((stay) => <ListingCard key={stay.slug} listing={stay} />)}</div>
      </section>

      <section className="grain border-y border-[#dfe2d8] bg-[#e7eadf] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Choose your pace</p><h2 className="mt-3 text-3xl leading-tight md:text-5xl">Two ways into Kumaon.</h2></div>
            <Compass className="hidden text-[#b66b45] md:block" size={34} strokeWidth={1.3} />
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {destinations.map((destination) => (
              <Link href={`/destinations/${destination.slug}`} key={destination.slug} className="image-card group relative aspect-[16/9] overflow-hidden rounded-xl">
                <Image src={destination.image} alt={destination.title} fill sizes="(max-width: 768px) 92vw, 50vw" className="card-image object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102f28]/85 via-[#102f28]/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white md:bottom-7 md:left-7 md:right-7">
                  <div><h3 className="text-3xl md:text-4xl">{destination.title}</h3><p className="sans mt-1 text-sm text-white/75">{destination.sub}</p></div>
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 transition group-hover:bg-white group-hover:text-[#173f35]"><ArrowRight size={17} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Travel journal</p>
            <h2 className="mt-3 text-3xl leading-tight md:text-5xl">Stories for slower mornings and better plans.</h2>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#173f35] underline decoration-[#b66b45]/50 underline-offset-8">Browse all stories <ArrowRight size={16} /></Link>
        </div>

        {blogs.length > 0 ? (
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {blogs.map((blog) => (
              <Link key={blog.slug} href={`/blog/${blog.slug}`} className="group overflow-hidden rounded-[1.75rem] border border-[#e3e7df] bg-white shadow-[0_20px_50px_rgba(23,63,53,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(23,63,53,.10)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {blog.featuredImage ? (
                    <Image src={blog.featuredImage} alt={blog.imageAltText || blog.title} fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#edf0ea] text-[#173f35]">
                      <BookOpenText size={36} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="sans flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b66b45]">
                    <span>{blog.category}</span>
                    <span>•</span>
                    <span>{new Date(blog.publishedAt ?? new Date()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="mt-3 text-2xl leading-tight text-[#173f35]">{blog.title}</h3>
                  <p className="sans mt-3 line-clamp-3 text-sm leading-6 text-[#607067]">{blog.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#24584a]">Read story <ArrowRight size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-9 rounded-[1.5rem] border border-dashed border-[#d3d8d1] bg-[#f6f7f3] p-8 text-center text-[#607067] sans">No journal stories are published yet. Check back soon for fresh travel notes from Kumaon.</div>
        )}
      </section>

    </>
  );
}

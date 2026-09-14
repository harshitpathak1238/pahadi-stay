import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Compass, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { SearchBox } from '@/components/SearchBox';
import { FeaturedStaysRail } from '@/components/public/FeaturedStaysRail';
import { Button } from '@/components/ui/Button';
import { destinations, stays as mockStays } from '@/lib/mock-data';
import { getPublishedBlogs } from '@/lib/blog';
import { getPublicListings } from '@/lib/listings';
import { getPublicPackages } from '@/lib/packages';
import { db } from '@/lib/db';
import { relativeTime } from '@/lib/reviews';

const packageExcerpt = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);

const values = [
  { icon: Sparkles, title: 'Thoughtfully chosen', text: 'Stays and experiences we would recommend to friends.' },
  { icon: ShieldCheck, title: 'Clear from the start', text: 'Straightforward details, honest prices, no surprises.' },
  { icon: HeartHandshake, title: 'Local when it matters', text: 'A real person to help before and during your trip.' },
];

export default async function Home() {
  const blogs = (await getPublishedBlogs()).slice(0, 3);
  // Live catalogue when the database is reachable; static fallback otherwise.
  const { data: stayResult } = await getPublicListings('STAY');
  const liveStays = stayResult.length ? stayResult : mockStays;
  const { data: packageResult } = await getPublicPackages();
  let recentReviews: { id: string; guest: string; comment: string; rating: number; stay: string; ago: string }[] = [];
  let reviewCount = 0;
  let reviewAverage: number | null = null;
  try {
    const rows = await db.review.findMany({ where: { status: 'APPROVED' }, include: { listing: { select: { title: true } } }, orderBy: { createdAt: 'desc' }, take: 3 });
    recentReviews = rows.map((row) => ({ id: row.id, guest: row.guestName || 'Guest', comment: row.comment, rating: row.overallRating, stay: row.listing.title, ago: relativeTime(row.createdAt.toISOString()) }));
    if (rows.length) {
      const aggregate = await db.review.aggregate({ where: { status: 'APPROVED' }, _count: true, _avg: { overallRating: true } });
      reviewCount = aggregate._count;
      reviewAverage = Math.round((aggregate._avg.overallRating ?? 0) * 10) / 10;
    }
  } catch {
    /* reviews are best-effort on the home page */
  }

  return (
    <>
      <section className="hero-wash px-4 text-[#f7f4ec]">
        <div className="mx-auto w-full max-w-7xl">
          <div className="hero-copy max-w-3xl">
            <p className="sans rise text-xs font-bold uppercase tracking-[.24em] text-[#e5b785]">Your next Kumaon escape</p>
            <h1 className="rise mt-4 max-w-2xl text-[2.6rem] leading-[1.02] md:text-7xl lg:text-[5.8rem]">Find your quiet <i>place.</i></h1>
            <p className="sans rise mt-3 max-w-lg text-[15px] leading-6 text-white/85 md:text-lg">Handpicked stays, easy rides, and small adventures around Bhimtal and Kainchi Dham.</p>
          </div>
          <div className="rise mt-7 md:mt-14"><SearchBox /></div>
          <div className="sans mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
            <span className="flex items-center gap-2"><Compass size={15} className="text-[#e5b785]" /> Start with a place</span>
            <Link href="/packages" className="inline-flex items-center gap-1 text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white">Browse curated packages <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 mt-2 px-4">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-[#e0e6e0] bg-[#e0e6e0] shadow-[0_14px_35px_rgba(23,63,53,.1)] sm:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => <div key={title} className="bg-white px-4 py-4 sm:px-6"><Icon size={20} strokeWidth={1.8} className="text-[#b66b45]" /><h3 className="mt-2.5 text-[15px] font-semibold text-[#173f35]">{title}</h3><p className="sans mt-1 text-xs leading-5 text-[#6c7770]">{text}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-24">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Stay with us</p>
            <h2 className="mt-3 max-w-xl text-2xl leading-snug md:text-5xl">Explore the best hotels &amp; <i>homestays.</i></h2>
            <p className="sans mt-4 max-w-xl text-sm leading-7 text-[#6c7770]">Handpicked stays around Bhimtal, Bhowali and the Kainchi hills — each one chosen for warmth, views and a genuine Kumaoni welcome.</p>
          </div>
          <Button href="/stays" variant="quiet">See all stays <ArrowRight size={16} /></Button>
        </div>
        <FeaturedStaysRail stays={liveStays.slice(0, 8)} />
      </section>

{/* Explore our most popular packages */}
      <section className="grain border-y border-[#dfe2d8] bg-[#e7eadf] px-4 py-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Curated escapes</p>
              <h2 className="mt-3 max-w-2xl text-2xl leading-snug md:text-5xl">Explore our most popular <i>packages.</i></h2>
            </div>
            <Button href="/packages" variant="quiet">Browse all packages <ArrowRight size={16} /></Button>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {packageResult.length > 0 ? packageResult.slice(0, 4).map((item) => (
              <Link key={item.id} href={`/packages/${item.id}`} className="group grid grid-cols-[128px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-[#24584a] text-white ring-1 ring-[#1d4a3e] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(23,63,53,.24)] sm:grid-cols-[190px_minmax(0,1fr)] md:grid-cols-[230px_minmax(0,1fr)]">
                <div className="relative min-h-[148px] overflow-hidden bg-[#173f35] sm:min-h-[168px] md:min-h-[188px]">
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/70"><Sparkles size={30} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102f28]/70 via-transparent to-transparent" />
                  <span className="sans absolute left-2.5 top-2.5 rounded-full border border-white/35 bg-[#173f35]/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-white backdrop-blur-sm">{item.location}</span>
                </div>
                <div className="flex min-w-0 flex-col p-4 sm:p-5">
                  <p className="sans text-[10px] font-bold uppercase tracking-[.18em] text-[#e6b17e]">Travel package</p>
                  <h3 className="mt-1.5 text-base font-semibold leading-snug text-white sm:text-lg md:text-xl">{item.title}</h3>
                  {item.description && <p className="sans mt-1.5 hidden line-clamp-2 text-xs leading-5 text-white/70 sm:block">{packageExcerpt(item.description)}</p>}
                  <div className="mt-auto flex min-w-0 items-end justify-between gap-3 border-t border-white/15 pt-3 sm:pt-3.5">
                    <p className="sans min-w-0">
                      <span className="block text-[10px] uppercase tracking-[.16em] text-white/55">Per package</span>
                      <span className="text-base font-bold text-[#e6b17e]">₹{item.price.toLocaleString('en-IN')}</span>
                    </p>
                    <span className="sans inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#f0c28f]">View package <ArrowRight size={15} /></span>
                  </div>
                </div>
              </Link>
            )) : (
              <p className="sans rounded-[1.5rem] border border-dashed border-[#d3d8d1] bg-[#f6f7f3] p-8 text-center text-[#607067]">Curated packages are on their way — check back soon.</p>
            )}
        
</div>
</div>
      </section>
{/* Reviews & about us */}
      <section className="relative z-10 px-4">
        <div className="mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[2rem] border border-[#dfe2d8] bg-[#fdfaf3] shadow-[0_18px_44px_rgba(23,63,53,.08)] lg:grid-cols-2">
          <div className="flex flex-col p-6 md:p-10">
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">The Pahadi way</p>
            <h2 className="mt-3 text-[1.8rem] leading-snug text-[#173f35] md:text-4xl">Built for the hills, <i>by the people who live there.</i></h2>
            <p className="sans mt-5 text-sm leading-7 text-[#6c7770]">Pahadi Stay exists to make the good parts of Kumaon easier to find, while keeping the value with the people who make this place worth visiting. Thoughtful stays, easy rides and small adventures — arranged with care, priced with honesty.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#dfe2d8] pt-4 md:gap-4">
              {[
                { value: `${liveStays.length}`, label: 'handpicked stays' },
                { value: `${Math.max(packageResult.length, 1)}`, label: 'curated packages' },
                { value: reviewAverage ? `${reviewAverage.toFixed(1)}★` : '4.9★', label: 'guest rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="sans text-2xl font-bold text-[#173f35]">{stat.value}</p>
                  <p className="sans mt-1 text-[10px] uppercase tracking-[.14em] text-[#8a948c]">{stat.label}</p>
                </div>
              ))}
            </div>
            <Button href="/about" variant="outline">Our story <ArrowRight size={16} /></Button>
          </div>

          <div className="flex flex-col p-6 md:p-10">
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Guest reviews</p>
            {recentReviews.length > 0 ? (
              <div className="mt-5 space-y-4">
                {recentReviews.map((review) => (
                  <figure key={review.id} className="rounded-[1.25rem] border border-[#e3e7df] bg-white p-4 shadow-[0_10px_26px_rgba(23,63,53,.06)]">
                    <blockquote className="sans text-sm leading-6 text-[#526057]">“{review.comment}”</blockquote>
                    <figcaption className="sans mt-3 flex items-center gap-2 text-xs text-[#6c7770]">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e7eadf] text-[11px] font-bold text-[#173f35]">{review.guest.charAt(0).toUpperCase()}</span>
                      <span className="font-semibold text-[#173f35]">{review.guest}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{review.stay}</span>
                      <span aria-hidden="true">·</span>
                      <span>{review.ago}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.25rem] border border-dashed border-[#d3d8d1] bg-[#f6f7f3] p-7 text-center">
                <p className="text-sm font-semibold text-[#24584a]">Stories from the hills, soon.</p>
                <p className="sans mt-2 text-xs leading-5 text-[#607067]">Guest reviews will appear here as travellers share their stays. Until then, explore a stay and be among the first to leave one.</p>
              </div>
            )}
            <Link href="/about" className="sans mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#173f35] underline decoration-[#b66b45]/50 underline-offset-8">Why travellers choose us <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
      <section className="grain border-y border-[#dfe2d8] bg-[#e7eadf] px-4 py-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-6">
            <div><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Choose your pace</p><h2 className="mt-3 text-2xl leading-snug md:text-5xl">Two ways into Kumaon.</h2></div>
            <Compass className="hidden text-[#b66b45] md:block" size={34} strokeWidth={1.3} />
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {destinations.map((destination) => (
              <Link href={`/destinations/${destination.slug}`} key={destination.slug} className="image-card group relative aspect-[16/9] overflow-hidden rounded-xl">
                <Image src={destination.image} alt={destination.title} fill sizes="(max-width: 768px) 92vw, 50vw" className="card-image object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102f28]/85 via-[#102f28]/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white md:bottom-7 md:left-7 md:right-7">
                  <div><h3 className="text-2xl md:text-4xl">{destination.title}</h3><p className="sans mt-1 text-sm text-white/75">{destination.sub}</p></div>
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 transition group-hover:bg-white group-hover:text-[#173f35]"><ArrowRight size={17} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Travel journal</p>
            <h2 className="mt-3 text-2xl leading-snug md:text-5xl">Stories for slower mornings and better plans.</h2>
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

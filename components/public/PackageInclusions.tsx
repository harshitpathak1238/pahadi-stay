import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, BedDouble, Car, MapPin, Sparkles } from 'lucide-react';
import { inclusionKind } from '@/lib/package-inclusions-shared';
import type { PackageInclusion } from '@/lib/packages';

/**
 * "What's included" grid for a package page.
 *
 * Every card mirrors the `listingIds` an admin selected in the package editor,
 * so editing a package immediately changes what guests see here. Stays and
 * rides link through to their real detail page; categories without a detail
 * route render as informational cards rather than dead links.
 */

const KIND_META = {
  stay: { label: 'Stay', Icon: BedDouble, tint: 'text-[#24584a] bg-[#e8f3ec] ring-[#cbe4d5]' },
  ride: { label: 'Ride', Icon: Car, tint: 'text-[#8a5a00] bg-[#fdf3e7] ring-[#f0dcc0]' },
  rental: { label: 'Transport', Icon: Car, tint: 'text-[#1f5f6b] bg-[#e6f2f4] ring-[#c2dde2]' },
  activity: { label: 'Experience', Icon: Sparkles, tint: 'text-[#6b3f8f] bg-[#f3ecfa] ring-[#ded0ef]' },
  other: { label: 'Included', Icon: Sparkles, tint: 'text-[#526057] bg-[#eef1ee] ring-[#dde2dc]' },
} as const;

export function PackageInclusions({ inclusions }: { inclusions: PackageInclusion[] }) {
  if (!inclusions.length) return null;

  const stays = inclusions.filter((item) => item.category === 'STAY');
  const transport = inclusions.filter((item) => item.category !== 'STAY');

  return (
    <section aria-labelledby="package-inclusions" className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e4e3da] pb-5">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Curated for you</p>
          <h2 id="package-inclusions" className="mt-2.5 text-3xl leading-tight md:text-4xl">What&apos;s included</h2>
          <p className="sans mt-2.5 max-w-xl text-[15px] leading-6 text-[#526057]">
            Every stay and vehicle below is bundled into this package. Open a card to see the full details.
          </p>
        </div>
        <p className="sans shrink-0 rounded-full bg-[#f1f3ef] px-4 py-2 text-[13px] font-semibold text-[#3c5044]">
          {inclusions.length} included {inclusions.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {stays.length > 0 && (
        <div className="mt-8">
          <h3 className="sans flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#7c877d]">
            <BedDouble size={14} aria-hidden="true" /> Where you&apos;ll stay
          </h3>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((item) => (
              <InclusionCard key={item.id} item={item} featured />
            ))}
          </ul>
        </div>
      )}

      {transport.length > 0 && (
        <div className="mt-10">
          <h3 className="sans flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#7c877d]">
            <Car size={14} aria-hidden="true" /> Getting you around
          </h3>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {transport.map((item) => (
              <InclusionCard key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
function InclusionCard({ item, featured = false }: { item: PackageInclusion; featured?: boolean }) {
  const { label, Icon, tint } = KIND_META[inclusionKind(item.category)];

  const shell = 'group flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left ring-1 ring-[#e4e3da] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,63,53,.13)]';

  const body = (
    <>
      <div className={`relative overflow-hidden bg-[#eef3f0] ${featured ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}>
        <Image
          src={item.image}
          alt={item.title}
          fill
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 backdrop-blur-sm ${tint}`}>
          <Icon size={12} aria-hidden="true" />
          {label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h4 className="text-[17px] font-semibold leading-snug text-[#173f35]">{item.title}</h4>
        {item.location && (
          <p className="sans mt-1.5 flex items-center gap-1.5 text-[13px] text-[#6c7770]">
            <MapPin size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{item.location}</span>
          </p>
        )}
        {item.price > 0 && (
          <p className="sans mt-3 text-[13px] text-[#526057]">
            <span className="text-[17px] font-bold text-[#173f35]">₹{item.price.toLocaleString('en-IN')}</span>
            <span className="text-[#8b948c]"> / night</span>
          </p>
        )}
        <span className="sans mt-4 inline-flex items-center gap-1.5 pt-1 text-[13px] font-bold text-[#24584a]">
          {item.href ? 'View details' : 'Included in this package'}
          {item.href && <ArrowUpRight size={15} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
        </span>
      </div>
    </>
  );

  return (
    <li>
      {item.href ? (
        <Link href={item.href} className={shell}>
          {body}
        </Link>
      ) : (
        // No public detail page exists for this category, so render the card
        // without a link rather than sending guests to a 404.
        <div className={shell}>{body}</div>
      )}
    </li>
  );
}
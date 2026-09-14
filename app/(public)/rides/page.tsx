import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { getPublicRides, matchesRideQuery, type PublicRide } from '@/lib/rides';
import { cardDescriptionSnippet } from '@/lib/sanitize-html';
import { SearchBox } from '@/components/SearchBox';
import { RideQuickSearch } from '@/components/RideQuickSearch';
export const metadata = { title: 'Rides around Bhimtal' };
export const revalidate = 60;
const inr = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;
function RideCard({ ride }: { ride: PublicRide }) {
  const subtitle = ride.type === 'TRANSFER' ? [ride.fromLocation, ride.toLocation].filter(Boolean).join(' to ') : ride.stops.slice(0, 3).map((s) => s.label).join(' · ');
  const meta = [ride.distanceKm ? `${ride.distanceKm} km` : '', ride.durationDays ? `${ride.durationDays} ${ride.durationDays === 1 ? 'day' : 'days'}` : ''].filter(Boolean).join(' · ');
  const snippet = cardDescriptionSnippet(ride.description);
  return (
    <Link href={`/rides/${ride.slug}`} className="group grid grid-cols-[124px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e3da] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(23,63,53,.12)] hover:ring-[#d6d5c9] sm:grid-cols-[180px_minmax(0,1fr)] md:grid-cols-[300px_minmax(0,1fr)]">
      <div className="relative min-h-[136px] bg-[#eef3f0] sm:min-h-[150px] md:min-h-[196px]">
        {ride.image ? <Image src={ride.image} alt={ride.title} fill sizes="(max-width: 640px) 124px, (max-width: 768px) 180px, 300px" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : null}
        <span className="sans absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#173f35] backdrop-blur-sm sm:left-4 sm:top-4 sm:text-[11px]">{ride.type === 'TRANSFER' ? 'Transfer' : 'Sightseeing'}</span>
      </div>
      <div className="flex min-w-0 flex-col p-4 sm:p-5 md:p-6">
        <h3 className="text-lg font-semibold leading-snug text-[#173f35] sm:text-xl md:text-2xl">{ride.title}</h3>
        {subtitle && (
          <p className="sans mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#526057] sm:text-sm">
            <MapPin size={13} className="shrink-0 text-[#b66b45]" />
            <span className="truncate">{subtitle}</span>
          </p>
        )}
        {meta && <p className="sans mt-1.5 text-[10px] uppercase tracking-[.16em] text-[#8a948c] sm:text-[11px]">{meta}</p>}
        {snippet && <p className="sans mt-2.5 hidden line-clamp-2 text-sm leading-6 text-[#6c7770] sm:block">{snippet}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3 sm:pt-4">
          <p className="sans min-w-0">
            {ride.minFare === null ? (
              <span className="text-sm text-[#8a948c]">Pricing coming soon</span>
            ) : (
              <>
                <span className="block text-[10px] uppercase tracking-[.16em] text-[#8a948c]">Starting from</span>
                <span className="text-base font-bold text-[#173f35] sm:text-lg">{inr(ride.minFare)}</span>
              </>
            )}
          </p>
          <span className="sans inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#b66b45] transition-all duration-300 group-hover:gap-2.5">
            View ride
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
export default async function Rides({ searchParams }: { searchParams: { where?: string } }) {
  const { data: rides, degraded } = await getPublicRides();
  const query = searchParams.where ?? '';
  const filtered = rides.filter((ride) => matchesRideQuery(ride, query));
  const sightseeing = filtered.filter((ride) => ride.type === 'SIGHTSEEING');
  const transfers = filtered.filter((ride) => ride.type === 'TRANSFER');
  return (
    <div className="min-h-screen pb-20">
      {degraded && <div className="border-b px-5 py-3 text-center text-sm font-semibold" role="status">Our ride catalog is temporarily unavailable.</div>}
      <section className="mx-auto max-w-6xl px-5 pt-24 sm:pt-28 md:pt-36">
        <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Go further</p>
        <h1 className="mt-2.5 max-w-xl text-3xl sm:mt-3 sm:text-4xl md:text-5xl">Your ride through the hills.</h1>
        <p className="sans mt-3 max-w-lg text-sm leading-6 text-[#6c7770] sm:mt-5 sm:text-base sm:leading-7">Airport transfers, temple visits, and local drivers who know the road beyond the map.</p>
        <div className="mt-6 md:hidden"><RideQuickSearch /></div>
        <div className="mt-10 hidden rounded-2xl bg-[#173f35] p-5 md:block"><SearchBox /></div>
        {query.trim() && <p className="sans mt-6 text-sm">Showing {filtered.length} rides matching {query.trim()}. <Link href="/rides" className="font-bold underline">Clear search</Link></p>}
      </section>
      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="text-3xl text-[#173f35]">Sightseeing packages</h2>
        {sightseeing.length ? <div className="mt-6 grid gap-5">{sightseeing.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
          : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Sightseeing packages are being added soon.</p>}
      </section>
      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="text-3xl text-[#173f35]">Point-to-point transfers</h2>
        {transfers.length ? <div className="mt-6 grid gap-5">{transfers.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
          : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Transfer routes are being added soon.</p>}
      </section>
    </div>
  );
}

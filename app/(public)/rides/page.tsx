import Link from 'next/link';
import { getPublicRides, matchesRideQuery } from '@/lib/rides';
import { SearchBox } from '@/components/SearchBox';
import { RideQuickSearch } from '@/components/RideQuickSearch';
import { RideCardList, RideCategoryToggle } from '@/components/public/RidesExplorer';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
export const metadata = { title: 'Rides around Bhimtal' };
export const revalidate = 60;
export default async function Rides({ searchParams }: { searchParams: { where?: string } }) {
  const { data: rides, degraded } = await getPublicRides();
  const query = searchParams.where ?? '';
  const filtered = rides.filter((ride) => matchesRideQuery(ride, query));
  const sightseeing = filtered.filter((ride) => ride.type === 'SIGHTSEEING');
  const transfers = filtered.filter((ride) => ride.type === 'TRANSFER');
  return (
    <div className="min-h-screen pb-20">
      {degraded && <div className="border-b px-5 py-3 text-center text-sm font-semibold" role="status">Our ride catalog is temporarily unavailable.</div>}
      <section className="mx-auto max-w-6xl px-5 pt-5 sm:pt-6 md:pt-8">
        {/* Breadcrumb: Home › Rides */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Rides' }]} />
        <p className="sans mt-4 text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Go further</p>
        <h1 className="mt-2.5 max-w-xl text-3xl sm:mt-3 sm:text-4xl md:text-5xl">Your ride through the hills.</h1>
        <p className="sans mt-3 max-w-lg text-sm leading-6 text-[#6c7770] sm:mt-5 sm:text-base sm:leading-7">Airport transfers, temple visits, and local drivers who know the road beyond the map.</p>
        <div className="mt-6 md:hidden"><RideQuickSearch /></div>
        <div className="mt-10 hidden rounded-2xl bg-[#173f35] p-5 md:block"><SearchBox /></div>
        {query.trim() && <p className="sans mt-6 text-sm">Showing {filtered.length} rides matching {query.trim()}. <Link href="/rides" className="font-bold underline">Clear search</Link></p>}
      </section>
      <section className="mx-auto mt-10 max-w-6xl px-5">
        <RideCategoryToggle sightseeingCount={sightseeing.length} transfersCount={transfers.length} />

        <div id="rides-sightseeing" className="mt-8 scroll-mt-28">
          <h2 className="text-3xl text-[#173f35]">Sightseeing packages</h2>
          {sightseeing.length ? <div className="mt-6"><RideCardList rides={sightseeing} /></div>
            : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Sightseeing packages are being added soon.</p>}
        </div>

        <div id="rides-transfers" className="mt-12 scroll-mt-28">
          <h2 className="text-3xl text-[#173f35]">Point-to-point transfers</h2>
          {transfers.length ? <div className="mt-6"><RideCardList rides={transfers} /></div>
            : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Transfer routes are being added soon.</p>}
        </div>
      </section>
    </div>
  );
}

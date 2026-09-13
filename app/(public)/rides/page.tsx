import Link from 'next/link';
import Image from 'next/image';
import { getPublicRides, matchesRideQuery, type PublicRide } from '@/lib/rides';
import { SearchBox } from '@/components/SearchBox';
export const metadata = { title: 'Rides around Bhimtal' };
export const revalidate = 60;
const inr = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;
function RideCard({ ride }: { ride: PublicRide }) {
  const subtitle = ride.type === 'TRANSFER' ? [ride.fromLocation, ride.toLocation].filter(Boolean).join(' to ') : ride.stops.slice(0, 3).map((s) => s.label).join(' - ');
  return (
    <Link href={`/rides/${ride.slug}`} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-[#e4e3da]">
      <div className="relative h-52 overflow-hidden bg-[#eef3f0]">{ride.image ? <Image src={ride.image} alt={ride.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /> : null}
        <span className="sans absolute left-4 top-4 rounded-full bg-[#173f35]/85 px-3 py-1.5 text-xs font-semibold text-white">{ride.type === 'TRANSFER' ? 'Transfer' : 'Sightseeing'}</span>
      </div>
      <div className="p-6">
        <h3 className="text-2xl text-[#173f35]">{ride.title}</h3>
        {subtitle && <p className="sans mt-2 text-sm text-[#526057]">{subtitle}</p>}
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="sans text-sm">{ride.minFare === null ? 'Pricing coming soon' : `Starting from ${inr(ride.minFare)}`}</p>
          <span className="sans text-sm font-bold text-[#b66b45]">View ride</span>
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
      <section className="mx-auto max-w-6xl px-5 pt-28 md:pt-36">
        <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Go further</p>
        <h1 className="mt-3 max-w-xl text-5xl">Your ride through the hills.</h1>
        <p className="sans mt-5 max-w-lg leading-7 text-[#6c7770]">Airport transfers, temple visits, and local drivers who know the road beyond the map.</p>
        <div className="mt-10 rounded-2xl bg-[#173f35] p-5"><SearchBox /></div>
        {query.trim() && <p className="sans mt-6 text-sm">Showing {filtered.length} rides matching {query.trim()}. <Link href="/rides" className="font-bold underline">Clear search</Link></p>}
      </section>
      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="text-3xl text-[#173f35]">Sightseeing packages</h2>
        {sightseeing.length ? <div className="mt-6 grid gap-6 md:grid-cols-2">{sightseeing.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
          : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Sightseeing packages are being added soon.</p>}
      </section>
      <section className="mx-auto mt-12 max-w-6xl px-5">
        <h2 className="text-3xl text-[#173f35]">Point-to-point transfers</h2>
        {transfers.length ? <div className="mt-6 grid gap-6 md:grid-cols-2">{transfers.map((ride) => <RideCard key={ride.id} ride={ride} />)}</div>
          : <p className="sans mt-6 rounded-2xl border border-dashed p-10 text-center">Transfer routes are being added soon.</p>}
      </section>
    </div>
  );
}

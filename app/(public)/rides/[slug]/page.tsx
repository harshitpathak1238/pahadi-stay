import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicRide, getPublicRides } from '@/lib/rides';
import Image from 'next/image';
import Link from 'next/link';
import { FareBookingSection } from './FareBookingSection';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data } = await getPublicRides();
    return data.map((ride) => ({ slug: ride.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: ride } = await getPublicRide(params.slug);
  return { title: ride ? `${ride.title} - Rides` : 'Ride', description: ride?.description.slice(0, 160) };
}

export default async function RideDetail({ params }: { params: { slug: string } }) {
  const { data: ride, degraded } = await getPublicRide(params.slug);
  if (!ride) notFound();
  const stats: string[] = [];
  if (ride.distanceKm !== null) stats.push(`${ride.distanceKm} km`);
  if (ride.durationDays !== null) stats.push(ride.durationDays === 1 ? '1 day' : `${ride.durationDays} days`);
  return (
    <div className="min-h-screen pb-20">
      {degraded && <div className="border-b px-5 py-3 text-center text-sm font-semibold" role="status">Ride details are temporarily unavailable.</div>}
      <section className="mx-auto max-w-6xl px-5 pt-28 md:pt-36">
        <Link href="/rides" className="sans text-sm font-bold text-[#24584a] underline">Back to rides</Link>
        <div className="relative mt-4 h-72 overflow-hidden rounded-2xl bg-[#eef3f0] md:h-96">
          {ride.image ? <Image src={ride.image} alt={ride.title} fill sizes="100vw" className="object-cover" /> : null}
          <span className="sans absolute left-4 top-4 rounded-full bg-[#173f35]/85 px-3 py-1.5 text-xs font-semibold text-white">{ride.type === 'TRANSFER' ? 'Transfer' : 'Sightseeing'}</span>
        </div>
        <h1 className="mt-6 text-4xl text-[#173f35] md:text-5xl">{ride.title}</h1>
        {ride.type === 'TRANSFER' && (ride.fromLocation || ride.toLocation) && <p className="sans mt-3 text-lg text-[#526057]">{[ride.fromLocation, ride.toLocation].filter(Boolean).join(' to ')}</p>}
        {stats.length > 0 && <p className="sans mt-3 flex flex-wrap gap-2">{stats.map((s) => <span key={s} className="rounded-full bg-[#eef3f0] px-3 py-1 text-sm font-semibold text-[#24584a]">{s}</span>)}</p>}
        {ride.description && <p className="sans mt-6 max-w-3xl leading-7 text-[#526057]">{ride.description}</p>}
        {ride.type === 'SIGHTSEEING' && ride.stops.length > 0 && (
          <div className="mt-10"><h2 className="text-2xl text-[#173f35]">Itinerary stops</h2>
            <ol className="mt-4 space-y-3">{ride.stops.map((s, i) => <li key={i} className="rounded-2xl bg-white p-5 ring-1 ring-[#e4e3da]"><p className="font-bold text-[#173f35]">{i + 1}. {s.label}</p>{s.note && <p className="sans mt-1 text-sm text-[#526057]">{s.note}</p>}</li>)}</ol>
          </div>
        )}
        <FareBookingSection ride={ride} />
      </section>
    </div>
  );
}


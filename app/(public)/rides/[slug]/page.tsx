import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicRide, getPublicRides } from '@/lib/rides';
import Link from 'next/link';
import { ChevronRight, Clock, MapPin, Route as RouteIcon } from 'lucide-react';
import { FareBookingSection } from './FareBookingSection';
import { RideGallery } from '@/components/public/RideGallery';

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
  const stats: { icon: typeof Clock; label: string }[] = [];
  if (ride.distanceKm !== null) stats.push({ icon: RouteIcon, label: `${ride.distanceKm} km` });
  if (ride.durationDays !== null) stats.push({ icon: Clock, label: ride.durationDays === 1 ? '1 day' : `${ride.durationDays} days` });
  const routeLine = [ride.fromLocation, ride.toLocation].filter(Boolean).join(' to ');
  const paragraphs = ride.description.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="min-h-screen pb-20">
      {degraded && <div className="border-b px-5 py-3 text-center text-sm font-semibold" role="status">Ride details are temporarily unavailable.</div>}
      <section className="mx-auto max-w-6xl px-5 pt-5 sm:pt-6 md:pt-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="sans flex items-center gap-1.5 text-xs text-[#8a948c] sm:text-sm">
          <Link href="/" className="transition hover:text-[#173f35]">Home</Link>
          <ChevronRight size={13} className="shrink-0 text-[#c4c9c0]" />
          <Link href="/rides" className="transition hover:text-[#173f35]">Rides</Link>
          <ChevronRight size={13} className="shrink-0 text-[#c4c9c0]" />
          <span className="truncate font-semibold text-[#173f35]">{ride.title}</span>
        </nav>

        {/* Media carousel (images + videos) */}
        <div className="mt-4">
          <RideGallery media={ride.images} title={ride.title} />
        </div>

        {/* Title block */}
        <div className="mt-6 md:mt-8">
          <span className="sans inline-block rounded-full bg-[#eef3f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#24584a] sm:text-[11px]">{ride.type === 'TRANSFER' ? 'Transfer' : 'Sightseeing'}</span>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#173f35] sm:text-4xl md:text-5xl">{ride.title}</h1>
          {routeLine && (
            <p className="sans mt-2.5 flex items-center gap-1.5 text-sm text-[#526057] sm:text-base">
              <MapPin size={15} className="shrink-0 text-[#b66b45]" />
              {routeLine}
            </p>
          )}
          {stats.length > 0 && (
            <p className="sans mt-3 flex flex-wrap gap-2">
              {stats.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#24584a] ring-1 ring-[#e4e3da]">
                  <Icon size={13} />
                  {label}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Content + sticky booking */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {ride.type === 'SIGHTSEEING' && ride.stops.length > 0 && (
              <div>
                <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">The journey</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#173f35] sm:text-3xl">Itinerary &amp; checkpoints</h2>
                <ol className="relative mt-6 space-y-6 border-l-2 border-[#e4e3da] pl-8">
                  {ride.stops.map((s, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[41px] grid h-6 w-6 place-items-center rounded-full bg-[#173f35] text-[11px] font-bold text-white ring-4 ring-[#faf6ec]">{i + 1}</span>
                      <p className="font-bold text-[#173f35]">{s.label}</p>
                      {s.note && <p className="sans mt-1 text-sm leading-6 text-[#6c7770]">{s.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {paragraphs.length > 0 && (
              <div className={ride.type === 'SIGHTSEEING' && ride.stops.length > 0 ? 'mt-10' : ''}>
                <p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">About this ride</p>
                <div className="mt-3 rounded-3xl bg-white p-6 ring-1 ring-[#e4e3da] sm:p-8">
                  {paragraphs.map((paragraph, i) => (
                    <p key={i} className={`sans leading-7 text-[#3d4a42] ${i === 0 ? 'text-base sm:text-lg sm:leading-8' : 'mt-4 text-sm sm:text-[15px]'} ${i > 0 ? '' : ''}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="self-start lg:sticky lg:top-24">
            <FareBookingSection ride={ride} />
          </aside>
        </div>
      </section>
    </div>
  );
}


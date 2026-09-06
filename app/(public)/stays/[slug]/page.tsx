import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicListing, getPublicListings } from "@/lib/listings";
import { StayDetailExperience } from "@/components/public/StayDetailExperience";
export async function generateStaticParams() {
  return (await getPublicListings('STAY')).map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const stay = await getPublicListing(params.slug);
  return { title: stay?.title ?? "Stay", description: stay?.description.replace(/<[^>]+>/g, '').slice(0, 160) };
}

export default async function StayDetail({ params }: { params: { slug: string } }) {
  const stay = await getPublicListing(params.slug);
  if (!stay) notFound();
  return <StayDetailExperience stay={stay} />;
}
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bath, BedDouble, BedSingle, CircleParking, ConciergeBell, Flower2, Info, Languages, Monitor, UserRound, Wifi } from "lucide-react";
import { getPublicListing, getPublicListings } from "@/lib/listings";
import { defaultStayFacilities, stayFacilityGroups } from "@/lib/stay-facilities";
import { Button } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { StayTripPanel } from "@/components/trip/StayTripPanel";
import { isFullBlogDocument, sanitizeBlogHtml } from "@/lib/sanitize-html";

const facilityIcons = { 'Great for your stay': UserRound, Bathroom: Bath, Bedroom: BedDouble, Outdoors: Flower2, 'Room amenities': BedSingle, 'Media & Technology': Monitor, Internet: Wifi, Parking: CircleParking, Services: ConciergeBell, General: Info, 'Languages spoken': Languages };
export async function generateStaticParams() {
  return (await getPublicListings('STAY')).map((stay) => ({ slug: stay.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const stay = await getPublicListing(params.slug);
  return { title: stay?.title ?? "Stay", description: stay?.description };
}
export default async function StayDetail({ params }: { params: { slug: string } }) {
  const stay = await getPublicListing(params.slug);
  if (!stay) notFound();
  const whatsappMessage = `Hello KainchiDarshan, I want to know more about the stay “${stay.title}” in ${stay.location}. Please share availability, amenities, and booking details.`;
  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 pt-5 md:grid-cols-[1.5fr_1fr] md:px-5 md:pt-8">
        <div className="relative min-h-[280px] overflow-hidden rounded-2xl md:min-h-[520px]">
          <img
            src={stay.image}
            alt={stay.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative hidden min-h-[520px] overflow-hidden rounded-2xl bg-[#dfe4da] md:block">
          <img
            src={stay.image}
            alt=""
            className="h-full w-full object-cover opacity-70"
          />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-9 md:px-5 md:py-12">
        <div className="grid gap-10 md:grid-cols-[1fr_360px] md:gap-12">
          <article>
            <p className="sans text-sm text-[#6c7770]">
              {stay.location} · {stay.rating} ★
            </p>
            <h1 className="mt-3 text-4xl leading-tight md:text-5xl">
              {stay.title}
            </h1>
            {isFullBlogDocument(stay.description) ? <iframe title={`${stay.title} description`} srcDoc={stay.description} sandbox="allow-same-origin" className="mt-6 min-h-[900px] w-full border-0" /> : <div className="prose mt-6 max-w-2xl text-base leading-7 text-[#526057] md:mt-7 md:text-lg md:leading-8" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(stay.description) }} />}
            <StayTripPanel slug={stay.slug} title={stay.title} price={stay.price} />
            <h2 className="mt-10 text-2xl md:mt-12">Facilities</h2>
            <div className="mt-5 grid gap-8 md:grid-cols-3">
              {stayFacilityGroups.map((group) => {
                const enabledItems = group.items.filter((item) => (stay.facilities ?? defaultStayFacilities)[item.key] ?? true);
                if (!enabledItems.length) return null;
                const Icon = facilityIcons[group.title as keyof typeof facilityIcons] || Info;
                return <section key={group.title} aria-labelledby={`facility-${group.title}`}><h3 id={`facility-${group.title}`} className="flex items-center gap-3 text-lg font-bold text-[#173f35]"><Icon size={22} strokeWidth={1.7} />{group.title}</h3><ul className="mt-3 grid gap-2 sans text-sm text-[#526057]">{enabledItems.map((item) => <li key={`${group.title}-${item.key}`} className="flex items-start gap-3"><span aria-hidden="true" className="text-[#24584a]">✓</span><span>{item.label}</span></li>)}</ul>{group.title === 'Internet' && <p className="mt-3 sans text-sm text-[#6c7770]">WiFi is available in all areas and is free of charge.</p>}</section>;
              })}
            </div>
            {stay.amenities.length > 0 && <div className="mt-8 rounded-xl bg-white p-4 sans text-sm"><p className="font-bold text-[#173f35]">Additional amenities</p><p className="mt-2 text-[#526057]">{stay.amenities.join(' · ')}</p></div>}
            <h2 className="mt-12 text-2xl">A note from guests</h2>
            <p className="mt-4 text-lg italic">
              “The kind of place that makes you extend your trip by one more
              night.”
            </p>
          </article>
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-[0_10px_40px_rgba(23,63,53,.08)] md:sticky md:top-6">
            <p className="sans text-sm text-[#6c7770]">From</p>
            <p className="mt-1 text-3xl">
              ₹{stay.price.toLocaleString("en-IN")}{" "}
              <span className="sans text-sm font-normal text-[#6c7770]">
                / night
              </span>
            </p>
            <div className="mt-6 grid gap-3 sans">
              <input
                type="date"
                className="rounded-xl border border-[#d6d9d1] p-3"
              />
              <input
                type="date"
                className="rounded-xl border border-[#d6d9d1] p-3"
              />
              <select className="rounded-xl border border-[#d6d9d1] p-3">
                <option>2 guests</option>
                <option>1 guest</option>
              </select>
            </div>
            <div className="mt-5 flex justify-between border-t pt-4 sans text-sm">
              <span>All-inclusive total</span>
              <strong>
                ₹
                {(stay.price + Math.round(stay.price * 0.05)).toLocaleString(
                  "en-IN",
                )}
              </strong>
            </div>
            <Button href="#trip-builder"><span className="w-full text-center">Add this stay to your trip</span></Button>
          </aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-[#dfe3d8] bg-[#f7f4ec]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(23,63,53,.12)] backdrop-blur md:hidden">
        <div>
          <p className="sans text-xs font-bold uppercase tracking-[.12em] text-[#6c7770]">
            {stay.location}
          </p>
          <p className="text-base font-bold text-[#173f35]">
            ₹{stay.price.toLocaleString("en-IN")}{" "}
            <small className="sans font-normal">/ night</small>
          </p>
        </div>
        <div className="flex gap-2">
          <WhatsAppButton message={whatsappMessage} className="px-3 py-2.5" />
          <Button href="#trip-builder">Build trip</Button>
        </div>
      </div>
    </div>
  );
}

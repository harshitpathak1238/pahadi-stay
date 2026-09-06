'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, Heart, MapPin, Share2, Star, Wifi, Car, Utensils, ShieldCheck, Users, Plane, Check, ThumbsUp, X } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { defaultStayFacilities, stayFacilityGroups } from '@/lib/stay-facilities';
import { isFullBlogDocument, sanitizeBlogHtml } from '@/lib/sanitize-html';
import { StayTripPanel } from '@/components/trip/StayTripPanel';

export function StayDetailExperience({ stay }: { stay: Listing }) {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [galleryOpen, setGalleryOpen] = useState<number | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'house-rules', label: 'House rules' },
    { id: 'reviews', label: 'Guest reviews (28)' },
  ];

  const gallery = [stay.image, stay.image, stay.image, stay.image, stay.image];
  const facilities = stayFacilityGroups.flatMap((group) =>
    group.items
      .filter((item) => (stay.facilities ?? defaultStayFacilities)[item.key] ?? true)
      .map((item) => ({ label: item.label, group: group.name }))
  );

  const faqs = [
    'What are the check-in and check-out times?',
    'How far is the property from the centre of Bhimtal?',
    'Is parking available at the property?',
    'Does the property offer breakfast?',
    'Can I bring my pet?',
    'What is the cancellation policy?',
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f5f7fa] text-[#1f2937]">
      {/* Header */}
      <div className="border-b border-[#d9e0e8] bg-[#003b95] text-white">
        <div className="mx-auto max-w-[1180px] px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-black">
              Kainchi
              <span className="text-[#feba02]">Darshan</span>
            </Link>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span>INR</span>
              <span>🇮🇳</span>
              <Link href="/partner/login" className="hidden md:block">
                List your property
              </Link>
              <Link href="/login" className="rounded bg-white px-3 py-2 text-[#003b95]">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        {/* Breadcrumb */}
        <div className="text-xs text-[#536274]">
          Home <span className="mx-2">›</span> Stays <span className="mx-2">›</span> {stay.location} <span className="mx-2">›</span> {stay.title}
        </div>

        {/* Sticky header block with title, rating, location, actions */}
        <div className="sticky top-0 z-10 -mx-4 -mb-5 bg-white px-4 py-3 shadow-sm md:-mx-6 md:px-6 md:py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#f59e0b]">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Star key={item} size={14} fill="currentColor" />
                  ))}
                </div>
                <span className="rounded bg-[#003b95] px-2 py-1 text-xs font-bold text-white">{stay.rating.toFixed(1)}</span>
              </div>
              <h1 className="mt-1 line-clamp-2 text-lg font-bold md:text-xl">{stay.title}</h1>
              <p className="mt-1 text-xs text-[#536274]">
                <MapPin size={13} className="mr-1 inline" />
                {stay.location} · <button className="font-semibold text-[#0071c2]">Excellent location</button>
              </p>
            </div>

            {/* Actions: wishlist, share, reserve */}
            <div className="flex gap-2">
              <button
                aria-label="Save property"
                onClick={() => setSaved(!saved)}
                className="rounded border border-[#b9c5d1] bg-white p-2 hover:bg-[#f5f7fa]"
              >
                <Heart
                  size={17}
                  fill={saved ? '#e11d48' : 'none'}
                  className={saved ? 'text-rose-600' : ''}
                />
              </button>
              <button aria-label="Share property" className="rounded border border-[#b9c5d1] bg-white p-2 hover:bg-[#f5f7fa]">
                <Share2 size={17} />
              </button>
              <Link href="#trip-builder" className="rounded bg-[#0071c2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005b9d]">
                Reserve
              </Link>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="sticky top-14 z-10 -mx-4 flex gap-5 overflow-x-auto border-b border-[#d9e0e8] bg-[#f5f7fa] px-4 py-2 text-sm font-bold md:-mx-6 md:px-6">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              className={`whitespace-nowrap border-b-4 px-1 py-2 transition ${
                activeTab === id
                  ? 'border-[#0071c2] text-[#0071c2]'
                  : 'border-transparent text-[#536274] hover:text-[#1f2937]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Gallery */}
        <section className="relative mt-5 grid gap-2 md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
          {gallery.slice(0, 5).map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setGalleryOpen(index)}
              className={`${
                index === 0 ? 'md:row-span-2 md:h-[430px] md:rounded-l-lg' : index === 1 ? 'hidden h-[214px] md:block md:rounded-tr-lg' : 'hidden md:block'
              } overflow-hidden`}
            >
              <img src={image} alt={index === 0 ? stay.title : ''} className={`h-full w-full object-cover ${index > 1 ? 'h-48' : ''}`} />
            </button>
          ))}
          <button onClick={() => setGalleryOpen(0)} className="absolute bottom-3 right-3 rounded bg-white px-3 py-2 text-xs font-bold">
            See all {gallery.length} photos
          </button>
        </section>

        {/* Main content grid: left column (content) + right column (booking panel) */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="min-w-0">
            {/* Overview tab section */}
            <section id="overview" className="scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-5 md:p-7">
              <h2 className="text-2xl font-bold">About this property</h2>
              {isFullBlogDocument(stay.description) ? (
                <iframe
                  title={`${stay.title} description`}
                  srcDoc={stay.description}
                  sandbox="allow-same-origin"
                  className="mt-4 min-h-[700px] w-full border-0"
                />
              ) : (
                <div
                  className="prose mt-4 max-w-none text-sm leading-7 text-[#536274]"
                  dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(stay.description) }}
                />
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded bg-[#eef7ff] p-4">
                  <p className="font-bold">Property highlights</p>
                  <p className="mt-2 text-sm text-[#536274]">Top-rated location, comfortable rooms, and thoughtful local hosting.</p>
                </div>
                <div className="rounded bg-[#eef7ff] p-4">
                  <p className="font-bold">Most popular facilities</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#536274]">
                    <span>
                      <Wifi size={14} className="mr-1 inline" />
                      WiFi
                    </span>
                    <span>
                      <Car size={14} className="mr-1 inline" />
                      Parking
                    </span>
                    <span>
                      <Utensils size={14} className="mr-1 inline" />
                      Breakfast
                    </span>
                    <span>
                      <ShieldCheck size={14} className="mr-1 inline" />
                      Safe stay
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Facilities tab section */}
            <section id="facilities" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-5 md:p-7">
              <h2 className="text-2xl font-bold">Facilities</h2>
              <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map(({ label }) => (
                  <p key={label} className="text-sm text-[#536274]">
                    <Check size={15} className="mr-2 inline text-[#16704a]" />
                    {label}
                  </p>
                ))}
              </div>
            </section>

            {/* House rules tab section */}
            <section id="house-rules" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-5 md:p-7">
              <h2 className="text-2xl font-bold">House rules</h2>
              <div className="mt-4 grid gap-3 text-sm text-[#536274]">
                <p>Check-in from 14:00 · Check-out by 11:00</p>
                <p>Quiet hours are observed after 22:00.</p>
                <p>Contact the host for cancellation and pet policies.</p>
              </div>
            </section>

            {/* Reviews tab section */}
            <section id="reviews" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-5 md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Guest reviews</h2>
                  <p className="mt-1 text-sm text-[#536274]">Guests love the location and warm hospitality.</p>
                </div>
                <div className="rounded bg-[#003b95] p-3 text-center text-white">
                  <strong className="text-2xl">{stay.rating.toFixed(1)}</strong>
                  <span className="block text-xs">Wonderful</span>
                </div>
              </div>

              {/* Review score bars */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {['Staff', 'Facilities', 'Cleanliness', 'Comfort', 'Value for money', 'Location'].map((label, index) => (
                  <div key={label} className="text-sm">
                    <div className="flex justify-between">
                      <span>{label}</span>
                      <b>{(9.1 - index * 0.1).toFixed(1)}</b>
                    </div>
                    <div className="mt-1 h-2 rounded bg-[#e5e7eb]">
                      <div className="h-2 rounded bg-[#0071c2]" style={{ width: `${91 - index}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample review quotes */}
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {['"Beautiful stay with an even better view."', '"Very clean, peaceful, and easy to reach."', '"The team made our weekend effortless."'].map(
                  (quote) => (
                    <div key={quote} className="rounded border border-[#e5e7eb] p-4 text-sm text-[#536274]">
                      <ThumbsUp size={15} className="text-[#0071c2]" />
                      <p className="mt-3">{quote}</p>
                      <p className="mt-3 text-xs font-bold text-[#1f2937]">Verified guest</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* FAQ section */}
            <section className="mt-5 rounded-lg border border-[#d9e0e8] bg-white p-5 md:p-7">
              <h2 className="text-2xl font-bold">Travelers are asking</h2>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {faqs.map((faq, index) => (
                  <button
                    key={faq}
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex items-center justify-between border-b border-[#e5e7eb] p-3 text-left text-sm hover:bg-[#f5f7fa]"
                  >
                    <span>
                      {faq}
                      {openFaq === index && <span className="mt-2 block text-xs text-[#536274]">We are happy to help. Contact the property team before booking for the latest details.</span>}
                    </span>
                    <ChevronDown size={16} className={`flex-shrink-0 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                ))}
              </div>
            </section>
          </article>

          {/* Right sidebar: price panel + booking + map + info */}
          <aside className="h-fit lg:sticky lg:top-48">
            {/* Price and booking panel */}
            <div id="trip-builder" className="rounded-lg border border-[#d9e0e8] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#536274]">From</p>
              <p className="mt-1 text-3xl font-bold">
                ₹{stay.price.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#536274]">/ night</span>
              </p>
              <p className="mt-2 text-xs text-[#536274]">Includes taxes and fees estimate</p>
              <StayTripPanel slug={stay.slug} title={stay.title} price={stay.price} />
            </div>

            {/* Property location */}
            <div className="mt-4 rounded-lg border border-[#d9e0e8] bg-white p-5">
              <h3 className="font-bold">Property location</h3>
              <div className="mt-3 flex h-40 items-center justify-center rounded bg-[#c9dfef] text-4xl">📍</div>
              <p className="mt-3 text-sm text-[#536274]">
                <MapPin size={15} className="mr-1 inline" />
                {stay.location}
              </p>
              <button className="mt-3 text-sm font-bold text-[#0071c2] hover:underline">Show on map</button>
            </div>

            {/* Good to know */}
            <div className="mt-4 rounded-lg border border-[#d9e0e8] bg-white p-5">
              <h3 className="font-bold">Good to know</h3>
              <p className="mt-3 text-sm text-[#536274]">
                <Plane size={15} className="mr-2 inline" />
                Airport pickup can be added to your trip.
              </p>
              <p className="mt-3 text-sm text-[#536274]">
                <Users size={15} className="mr-2 inline" />
                Great for couples, families, and small groups.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Gallery lightbox */}
      {galleryOpen !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <button aria-label="Close gallery" onClick={() => setGalleryOpen(null)} className="absolute right-5 top-5 rounded-full bg-white p-2 text-black">
            <X size={20} />
          </button>
          <img src={gallery[galleryOpen]} alt={stay.title} className="max-h-[85vh] max-w-[90vw] object-contain" />
          <button
            onClick={() => setGalleryOpen((galleryOpen + gallery.length - 1) % gallery.length)}
            className="absolute left-5 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]"
          >
            ‹
          </button>
          <button onClick={() => setGalleryOpen((galleryOpen + 1) % gallery.length)} className="absolute right-5 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]">
            ›
          </button>
        </div>
      )}
    </div>
  );
}

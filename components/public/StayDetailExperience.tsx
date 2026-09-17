'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ban, BedDouble, ChevronDown, ChevronLeft, ChevronRight, Heart, MapPin, Share2, Star, Wifi, Car, Utensils, ShieldCheck, Users, Plane, X } from 'lucide-react';
import type { Listing } from '@/lib/mock-data';
import { resolveStayPickup, type PickupRoute, type StayPickup } from '@/lib/pickup-pricing';
import type { StayReviewData } from '@/lib/reviews';
import { defaultStayFacilities, stayFacilityGroups } from '@/lib/stay-facilities';
import { facilityCategoryOrder, facilityMeta, defaultFacilityIcon, OTHER_FACILITY_CATEGORY } from '@/lib/facilityMeta';
import { isFullBlogDocument, sanitizeBlogHtml } from '@/lib/sanitize-html';
import { AutoHeightIframe } from '@/components/public/AutoHeightIframe';
import { StayTripPanel } from '@/components/trip/StayTripPanel';
import { StayReviews } from '@/components/public/StayReviews';
import { StayBottomBar } from '@/components/public/StayBottomBar';
import { StayEnquireButton, StayWhatsAppEnquiryModal } from '@/components/public/StayWhatsAppEnquiry';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useWishlist } from '@/hooks/use-wishlist';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';

export function StayDetailExperience({ stay, reviewData, pickupRoutes = [], pickupUnavailable = false }: { stay: Listing; reviewData?: StayReviewData | null; pickupRoutes?: PickupRoute[]; pickupUnavailable?: boolean }) {
  const [pickupSelection, setPickupSelection] = useState<StayPickup | null>(null);
  const pickup = !pickupUnavailable && pickupSelection
    ? resolveStayPickup(pickupRoutes, pickupSelection.routeId, pickupSelection.vehicleTypeId)
    : null;
  useEffect(() => { setPickupSelection(null); }, [stay.slug]);
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const saved = isWishlisted(stay.slug);
  const [heartPop, setHeartPop] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const prevSaved = useRef(saved);
  useEffect(() => {
    if (saved && !prevSaved.current) {
      setHeartPop(true);
      const timer = window.setTimeout(() => setHeartPop(false), 650);
      return () => window.clearTimeout(timer);
    }
    prevSaved.current = saved;
  }, [saved]);
  const shareStay = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: stay.title, text: `${stay.title} — ${stay.location}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage('Link copied');
        window.setTimeout(() => setShareMessage(''), 2000);
      }
    } catch { /* visitor dismissed the share sheet */ }
  };
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewCount, setReviewCount] = useState<number | null>(reviewData ? reviewData.reviews.length : null);
  // Header rating follows approved reviews once they exist. When there are no
  // approved reviews at all we hide the star badge entirely rather than faking
  // a 5.0 from the stale listing seed. The seed rating is kept only as an
  // editor-level courtesy until real reviews exist.
  const hasRealRating = !!(reviewData?.stats);
  const headerRating = hasRealRating ? reviewData!.stats!.overall5 : stay.rating;
  // Discount presentation: base price is the struck-through MRP, selling
  // price (stay.price) is the deal. Only shows when base is genuinely higher.
  const basePrice = typeof stay.basePrice === 'number' ? stay.basePrice : null;
  const discountOff = basePrice != null && basePrice > 0 && basePrice > stay.price
    ? Math.round(((basePrice - stay.price) / basePrice) * 100)
    : 0;
  const discountSavings = discountOff > 0 && basePrice != null ? basePrice - stay.price : 0;
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState<number | null>(null);
  const [roomGallery, setRoomGallery] = useState<{ accIndex: number; photoIndex: number } | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const tabNavRef = useRef<HTMLElement>(null);
  const accommodationsRef = useRef<HTMLDivElement>(null);
  const [tabCanScroll, setTabCanScroll] = useState(false);
  const isMobile = useIsMobile();
  const updateTabFade = () => {
    const el = tabNavRef.current;
    if (!el) return;
    setTabCanScroll(el.scrollWidth - el.clientWidth > 8);
  };
  useEffect(() => {
    updateTabFade();
    window.addEventListener('resize', updateTabFade);
    return () => window.removeEventListener('resize', updateTabFade);
  }, []);

  // Real uploaded photos first; falls back to the single cover image.
  const gallery = [...new Set([...(stay.images ?? []), stay.image])].filter(Boolean);
  const extraPhotoCount = gallery.length - 5;
  // Honor an admin-set map pin (full Google Maps URL, "lat,lng" coordinates, or
  // free text). Plain coordinates/text become a maps "?q=" search; a full URL is
  // linked verbatim. Falls back to a location-keyword search when no pin is set.
  const rawMapPin = (stay.mapPin ?? '').trim();
  const mapUrl = rawMapPin
    ? /^https?:\/\//i.test(rawMapPin)
      ? rawMapPin
      : `https://www.google.com/maps?q=${encodeURIComponent(rawMapPin)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(stay.location)}`;

  // Live review count (starts from SSR data, updates when reviews load).
  useEffect(() => {
    if (reviewData) setReviewCount(reviewData.reviews.length);
    const listener = (event: Event) => setReviewCount((event as CustomEvent<{ count: number }>).detail.count);
    window.addEventListener('stay-review-count', listener);
    return () => window.removeEventListener('stay-review-count', listener);
  }, [reviewData]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'house-rules', label: 'House rules' },
    { id: 'reviews', label: reviewCount === null ? 'Guest reviews' : `Guest reviews (${reviewCount})` },
  ];

  const facilities = stayFacilityGroups.flatMap((group) =>
    group.items
      .filter((item) => (stay.facilities ?? defaultStayFacilities)[item.key] ?? true)
      .map((item) => ({ label: item.label, group: group.title }))
  );

  const groupedFacilities = useMemo(() => {
    const knownLabels = new Set<string>();
    const groups = new Map<string, { label: string }[]>();
    for (const facility of facilities) {
      knownLabels.add(facility.label);
      const meta = facilityMeta[facility.label];
      const category = meta?.category ?? OTHER_FACILITY_CATEGORY;
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)?.push({ label: facility.label });
    }
    // Anything in the stay's raw amenities list that the checkbox model doesn't
    // know about still renders under "Other" instead of disappearing.
    for (const amenity of stay.amenities ?? []) {
      const label = amenity.trim();
      if (!label || knownLabels.has(label)) continue;
      const category = facilityMeta[label]?.category ?? OTHER_FACILITY_CATEGORY;
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)?.push({ label });
    }
    return facilityCategoryOrder
      .filter((category) => groups.has(category))
      .map((category) => ({ category, items: groups.get(category) ?? [] }));
  }, [facilities, stay.amenities]);

  // Flat, category-ordered list used by the compact "first N + View more" view.
  const flatFacilities = useMemo(() => {
    const out: { category: string; label: string }[] = [];
    for (const group of groupedFacilities) {
      for (const item of group.items) out.push({ category: group.category, label: item.label });
    }
    return out;
  }, [groupedFacilities]);

  const faqs = (stay.faqs ?? []).filter((faq) => faq.question.trim() && faq.answer.trim());

  // Private Spaces: admin-curated room/space cards shown only when present.
  const accommodations = (stay.accommodations ?? []).filter((acc) => acc.title.trim());
  const scrollAccommodations = (direction: -1 | 1) => {
    const el = accommodationsRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-acc-card]');
    const step = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  // Compact facilities UI: show the first N items inline; the rest hide behind "View more".
  const defaultVisibleCount = 4;
  const visibleFacilities = useMemo(() => {
    return flatFacilities.slice(0, showAllFacilities ? flatFacilities.length : defaultVisibleCount);
  }, [flatFacilities, showAllFacilities]);
  const hiddenFacilities = flatFacilities.slice(defaultVisibleCount);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // Keep the tapped tab fully visible inside the horizontally scrollable
    // bar (inline:center) without jumping the page vertically (block:nearest).
    document.getElementById(`tab-${tabId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Lightbox keyboard support: Escape closes, arrows navigate.
  useEffect(() => {
    if (galleryOpen === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGalleryOpen(null);
      if (event.key === 'ArrowLeft') setGalleryOpen((current) => ((current ?? 0) + gallery.length - 1) % gallery.length);
      if (event.key === 'ArrowRight') setGalleryOpen((current) => ((current ?? 0) + 1) % gallery.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galleryOpen, gallery.length]);

  // Room photo lightbox: same keyboard behaviour, scoped to one accommodation.
  const roomPhotos = roomGallery ? photosOf(accommodations[roomGallery.accIndex]) : [];
  useEffect(() => {
    if (!roomGallery) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRoomGallery(null);
      if (event.key === 'ArrowLeft') setRoomGallery((current) => current ? { ...current, photoIndex: (current.photoIndex + roomPhotos.length - 1) % roomPhotos.length } : current);
      if (event.key === 'ArrowRight') setRoomGallery((current) => current ? { ...current, photoIndex: (current.photoIndex + 1) % roomPhotos.length } : current);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomGallery, roomPhotos.length]);
  // Shared wishlist + share controls — rendered beside the stars on mobile and beside the title on sm+; only one copy is visible at a time.
  const wishlistShareControls = (
    <>
      {shareMessage && (
        <span className="sans shrink-0 rounded-full bg-[#173f35] px-2.5 py-1 text-[10px] font-bold text-white">{shareMessage}</span>
      )}
      <button
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={saved}
        onClick={() => toggleWishlist(stay.slug)}
        title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        className={`grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 transition hover:bg-[#f5f7fa] ${saved ? 'ring-[#f3c3cf]' : 'ring-[#e4e8e2]'} ${heartPop ? 'heart-pop' : ''}`}
      >
        <Heart size={17} fill={saved ? '#e11d48' : 'none'} className={saved ? 'text-rose-600' : 'text-[#536274]'} />
      </button>
      <button
        aria-label="Share property"
        title="Share this stay"
        onClick={shareStay}
        className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-[#e4e8e2] transition hover:bg-[#f5f7fa]"
      >
        <Share2 size={16} className="text-[#536274]" />
      </button>
    </>
  );

  return (
    <div className="bg-[#f5f7fa] text-[#1f2937]">
      <main className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        {/* Breadcrumb: Home › Stays › City › Property — ancestors are links */}
        <Breadcrumbs
          className="mb-4 pt-3"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stays', href: '/stays' },
            { label: stay.location, href: `/stays?location=${encodeURIComponent(stay.location)}` },
            { label: stay.title },
          ]}
        />

        {/* Title, rating, location, and actions — sits flush on the page background; spacing (not a card) separates it from the breadcrumb above and the tab row below. Mobile: wishlist + share mirror the star row (opposite side); sm+: actions sit beside the title. */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-x-6 md:mb-8">
          <div className="min-w-0 sm:flex-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:block">
              <div className="flex items-center gap-2">
                {hasRealRating && (
                  <div className="flex items-center gap-1 text-[#f59e0b]" aria-label={`${headerRating.toFixed(1)} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <Star
                        key={item}
                        size={15}
                        fill={item <= Math.round(headerRating) ? 'currentColor' : 'none'}
                        className={item <= Math.round(headerRating) ? 'text-[#f59e0b]' : 'text-[#d1d5db]'}
                      />
                    ))}
                  </div>
                )}
                {hasRealRating && (
                  <span className="rounded-full bg-[#003b95] px-2.5 py-1 text-xs font-bold text-white">{headerRating.toFixed(1)}</span>
                )}
                {!hasRealRating && (
                  <span className="rounded-full border border-[#d5e5ef] bg-[#eef7ff] px-2.5 py-1 text-xs font-semibold text-[#24584a]">New</span>
                )}
              </div>

              {/* Mobile: wishlist + share sit opposite the stars; no Reserve here — the sticky bottom bar owns the booking CTA */}
              <div className="flex shrink-0 items-center gap-2 sm:hidden">
                {wishlistShareControls}
              </div>
            </div>
            <h1 className="mb-2 line-clamp-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">{stay.title}</h1>
            <p className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed text-[#536274]">
              <MapPin size={13} className="inline shrink-0" />
              <span>{stay.location}</span>
              <span aria-hidden="true">·</span>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0071c2] hover:underline"
              >
                Excellent location — show map
              </a>
            </p>
          </div>

          {/* Wishlist + share + reserve (sm+ only) — sits beside the title so photo cards read clean; on mobile the same controls live opposite the stars and the bottom bar owns Reserve */}
          <div className="ml-auto hidden shrink-0 flex-wrap items-center gap-2 self-start sm:flex">
            {wishlistShareControls}
            {stay.fullyBooked ? (
              <span
                aria-disabled="true"
                title="This stay is fully booked right now"
                className="flex cursor-not-allowed select-none items-center gap-1.5 rounded bg-[#e5e7eb] px-4 py-2.5 text-xs font-bold text-[#8b95a1]"
              >
                <Ban size={14} /> Fully booked
              </span>
            ) : (
              <Link href="#trip-builder" className="flex items-center rounded bg-[#0071c2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005b9d]">
                Reserve
              </Link>
            )}
          </div>
        </div>

        {/* Tab navigation — horizontally scrollable on mobile with snap + fade */}
        <div className="relative">
          <nav
            ref={tabNavRef}
            onScroll={updateTabFade}
            className="-mx-4 flex gap-3 overflow-x-auto border-b border-[#d9e0e8] bg-[#f5f7fa] px-4 py-2.5 text-sm font-bold no-scrollbar snap-x snap-mandatory md:-mx-6 md:gap-5 md:px-6 lg:sticky lg:top-14"
            aria-label="Stay page sections"
          >
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => handleTabClick(id)}
                className={`snap-start whitespace-nowrap border-b-4 px-3 py-2 transition ${
                  activeTab === id
                    ? 'border-[#0071c2] text-[#0071c2]'
                    : 'border-transparent text-[#536274] hover:text-[#1f2937]'
                }`}
              >
                {label}
              </button>
            ))}
            <span aria-hidden="true" className="snap-start w-4 shrink-0" />
          </nav>
          {tabCanScroll && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -right-4 w-14 bg-gradient-to-l from-[#f5f7fa] via-[#f5f7fa]/60 to-transparent"
            />
          )}
        </div>

        {/* Gallery: full-width hero on top + thumbnail row below.
            Thumbnail count/layout depends on total photos:
            1 -> hero only; 2 -> one full-width thumb; 3 -> two halves;
            4 -> three thirds; 5 -> 2x2 all real; >5 -> 2x2 with +N overlay tile. */}
        <section className="mt-5 space-y-2" aria-label={`Photos of ${stay.title}`}>
          {gallery.length === 0 && (
            <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-[#c9c9cc] text-xs text-[#777] sm:h-[320px]">No photos yet</div>
          )}
          {/* Hero image — compact on mobile so the gallery doesn't dominate the page */}
          {gallery.length > 0 && (<>
          <button
            type="button"
            onClick={() => setGalleryOpen(0)}
            aria-label={`Open photo gallery of ${stay.title}`}
            className="group relative h-[240px] w-full overflow-hidden rounded-2xl sm:h-[320px] md:h-[400px]"
          >
            <Image src={gallery[0]} alt={stay.title} fill priority sizes="100vw" className="object-cover transition duration-500 group-hover:scale-105" />
            {gallery.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#173f35] shadow-sm sm:text-sm">See all {gallery.length} photos</span>
            )}
          </button>

          {gallery.length >= 2 && gallery.length <= 4 && (
            <div className={`grid h-[110px] gap-2 sm:h-[140px] ${gallery.length === 2 ? 'grid-cols-1' : gallery.length === 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {gallery.slice(1).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setGalleryOpen(index + 1)}
                  aria-label={`Open photo ${index + 2} of ${gallery.length}`}
                  className="group relative w-full overflow-hidden rounded-2xl"
                >
                  <Image src={image} alt={`${stay.title} photo ${index + 2}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}

          {gallery.length >= 5 && (
            <div className="grid h-[228px] grid-cols-2 grid-rows-2 gap-2 sm:h-[288px]">
              {gallery.slice(1, 4).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setGalleryOpen(index + 1)}
                  aria-label={`Open photo ${index + 2} of ${gallery.length}`}
                  className="group relative w-full overflow-hidden rounded-2xl"
                >
                  <Image src={image} alt={`${stay.title} photo ${index + 2}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGalleryOpen(4)}
                aria-label={extraPhotoCount > 0 ? `Show all ${gallery.length} photos` : `Open photo 5 of ${gallery.length}`}
                className="group relative w-full overflow-hidden rounded-2xl"
              >
                <Image src={gallery[4]} alt={`${stay.title} photo 5`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                {extraPhotoCount > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white transition group-hover:bg-black/60">
                    +{extraPhotoCount} photos
                  </span>
                )}
              </button>
            </div>
          )}
          </>)}
        </section>

        {/* Main content grid: left column (content) + right column (booking panel) */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="min-w-0">
            <section id="overview" className="scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-5 md:p-7">
              <h2 className="text-xl font-bold sm:text-2xl">About this property</h2>
              {isFullBlogDocument(stay.description) ? (
                <AutoHeightIframe
                  title={`${stay.title} description`}
                  srcDoc={stay.description}
                  minHeight={0}
                  className="mt-3 sm:mt-4"
                />
              ) : (
                <div
                  className="prose mt-3 max-w-none text-sm leading-7 text-[#536274] sm:mt-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(stay.description) }}
                />
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded bg-[#eef7ff] p-4">
                  <p className="font-bold">Property highlights</p>
                  <p className="mt-2 text-xs text-[#536274] sm:text-sm">Top-rated location, comfortable rooms, and thoughtful local hosting.</p>
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

            {/* Private Spaces — accommodation cards, only when the admin added them */}
            {accommodations.length > 0 && (
              <section aria-label="Private spaces" className="mt-5 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-5 md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Private Spaces <span className="text-sm font-normal text-[#536274]">({accommodations.length})</span>
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label="Scroll private spaces left"
                      onClick={() => scrollAccommodations(-1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-[#d9e0e8] bg-white text-[#0071c2] transition hover:bg-[#f5f7fa]"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll private spaces right"
                      onClick={() => scrollAccommodations(1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-[#d9e0e8] bg-white text-[#0071c2] transition hover:bg-[#f5f7fa]"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div ref={accommodationsRef} className="mt-4 flex snap-x gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {accommodations.map((acc, index) => (
                    <AccommodationCard
                      key={`${acc.title}-${index}`}
                      acc={acc}
                      onOpen={(photoIndex) => setRoomGallery({ accIndex: index, photoIndex })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Facilities tab section — compact by default, expandable via View more */}
          <section id="facilities" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-4 sm:p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold sm:text-2xl">Facilities</h2>
              {flatFacilities.length > defaultVisibleCount && (
                <button
                  type="button"
                  onClick={() => setShowAllFacilities((current) => !current)}
                  aria-expanded={showAllFacilities}
                  className="shrink-0 rounded-full border border-[#d9e0e8] bg-white px-4 py-1.5 text-xs font-semibold text-[#24584a] hover:bg-[#f5f7fa]"
                >
                  {showAllFacilities ? 'Show fewer' : 'View more (' + (flatFacilities.length - defaultVisibleCount) + ' more)'}
                </button>
              )}
            </div>
            {!showAllFacilities && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2.5">
                {visibleFacilities.map((facility) => {
                  const Icon = facilityMeta[facility.label]?.icon ?? defaultFacilityIcon;
                  return (
                    <div key={facility.label} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#fafbfa] px-2 py-1.5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
                      <Icon size={14} className="shrink-0 text-[#24584a]" />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-[#23332e] sm:whitespace-normal sm:text-sm">{facility.label}</span>
                      <span className="hidden rounded-full bg-[#eef3ef] px-2 py-0.5 text-xs font-semibold text-[#24584a] sm:inline">
                        {facility.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {showAllFacilities && (
              <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4">
                {groupedFacilities.map((group) => (
                  <div key={group.category} className="rounded-xl border border-[#eef1f4] bg-[#fdfdfc] p-3 sm:p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#8a94a3] sm:text-xs">{group.category}</p>
                    <div className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:mt-2 sm:grid-cols-2 sm:gap-y-2">
                      {group.items.map((item) => {
                        const Icon = facilityMeta[item.label]?.icon ?? defaultFacilityIcon;
                        return (
                          <p key={item.label} className="flex items-start gap-2 text-xs text-[#536274] sm:text-sm">
                            <Icon size={14} className="mt-0.5 shrink-0 text-[#24584a]" />
                            <span>{item.label}</span>
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* House rules tab section — live from backend, shown uniquely per rule */}
            {stay.houseRules && stay.houseRules.length > 0 ? (
              <section id="house-rules" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-4 sm:p-5 md:p-7">
                <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  <ShieldCheck size={20} className="text-[#24584a]" />
                  House rules
                </h2>
                <p className="mt-2 text-xs text-[#536274] sm:text-sm">
                  These rules are set by the host for this property. Always check with the host if anything is unclear before you arrive.
                </p>
                <div className="mt-3 grid gap-2 sm:mt-5 sm:gap-3">
                  {stay.houseRules.map((rule, index) => (
                    <div
                      key={index}
                      className="group flex gap-2.5 rounded-xl border border-[#e5e7eb] bg-[#fafbfa] p-3 transition hover:border-[#c9d6cf] hover:bg-white sm:gap-3 sm:p-4"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-xs font-bold text-[#24584a] sm:h-7 sm:w-7 sm:text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#23332e] sm:text-sm">{rule.title}</p>
                        <p className="mt-0.5 text-xs text-[#536274] sm:text-sm">{rule.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {stay.houseRules.length === 0 && (
                  <p className="mt-3 text-sm text-[#536274]">House rules are coming soon — please contact the host for the latest information.</p>
                )}
              </section>
            ) : (
              /* Fallback when no rules are stored yet */
              <section id="house-rules" className="mt-5 scroll-mt-24 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-4 sm:p-5 md:p-7">
                <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  <ShieldCheck size={20} className="text-[#24584a]" />
                  House rules
                </h2>
                <p className="mt-2 text-xs text-[#536274] sm:text-sm">This property&apos;s house rules are being finalised. Please contact the host for the latest information.</p>
              </section>
            )}

            {/* Reviews tab section — live data with hardcoded blocks removed. */}
            <StayReviews initial={reviewData ?? null} />

            {/* FAQ section */}
            {faqs.length > 0 && (
              <section className="mt-5 rounded-lg border border-[#d9e0e8] bg-white p-4 sm:p-5 md:p-7">
                <h2 className="text-xl font-bold sm:text-2xl">Travelers are asking</h2>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {faqs.map((faq, index) => (
                    <button
                      key={`${faq.question}-${index}`}
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      aria-expanded={openFaq === index}
                      className="flex items-center justify-between border-b border-[#e5e7eb] p-3 text-left text-sm hover:bg-[#f5f7fa]"
                    >
                      <span>
                        {faq.question}
                        {openFaq === index && <span className="mt-2 block text-xs text-[#536274]">{faq.answer}</span>}
                      </span>
                      <ChevronDown size={16} className={`flex-shrink-0 transition ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Right sidebar: price panel + booking + map + info */}
          <aside className="h-fit min-w-0 lg:sticky lg:top-48">
            {/* Price and booking panel */}
            <div id="trip-builder" className="rounded-lg border border-[#d9e0e8] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#536274]">From</p>
                {discountOff > 0 && (
                  <span className="rounded-full bg-[#e7f2ec] px-2.5 py-1 text-[11px] font-bold text-[#1d7a4f]">{discountOff}% off</span>
                )}
              </div>
              <p className="mt-1 text-3xl font-bold">
                ₹{stay.price.toLocaleString('en-IN')} <span className="text-sm font-normal text-[#536274]">/ night</span>
                {discountOff > 0 && basePrice != null && (
                  <span className="ml-2 align-middle text-base font-semibold text-[#8a948c] line-through">₹{basePrice.toLocaleString('en-IN')}</span>
                )}
              </p>
              {discountOff > 0 && basePrice != null && (
                <p className="mt-1.5 text-sm font-semibold text-[#1d7a4f]">
                  You save ₹{discountSavings.toLocaleString('en-IN')} ({discountOff}%)
                </p>
              )}
              <p className="mt-2 text-xs text-[#536274]">Includes taxes and fees estimate</p>
              <StayTripPanel slug={stay.slug} title={stay.title} price={stay.price} fullyBooked={Boolean(stay.fullyBooked)} pickupRoutes={pickupRoutes} pickupUnavailable={pickupUnavailable} pickup={pickup} onPickupChange={setPickupSelection} />
              <div className="mt-4 rounded-xl border border-[#d6e8dd] bg-[#f2faf5] p-3.5">
                <StayEnquireButton onClick={() => setEnquiryOpen(true)} className="w-full" />
                <p className="sans mt-2 text-center text-[11px] leading-4 text-[#4c6a5d]">Pick your bedroom(s) &amp; send a ready-made enquiry on WhatsApp.</p>
              </div>
            </div>

            {/* Property location */}
            <div className="mt-4 rounded-lg border border-[#d9e0e8] bg-white p-5">
              <h3 className="font-bold">Property location</h3>
              <div className="mt-3 flex h-40 items-center justify-center rounded bg-[#c9dfef] text-4xl">📍</div>
              <p className="mt-3 text-sm text-[#536274]">
                <MapPin size={15} className="mr-1 inline" />
                {stay.location}
              </p>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-bold text-[#0071c2] hover:underline"
              >
                Show on map
              </a>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`${stay.title} photo gallery`}>
          <button aria-label="Close gallery" onClick={() => setGalleryOpen(null)} className="absolute right-5 top-5 z-10 rounded-full bg-white p-2 text-black hover:bg-[#f5f7fa]">
            <X size={20} />
          </button>
          <div className="relative h-[80vh] w-full max-w-[1180px]">
            <Image src={gallery[galleryOpen]} alt={`${stay.title} photo ${galleryOpen + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <button
            aria-label="Previous photo"
            onClick={() => setGalleryOpen((current) => ((current ?? 0) + gallery.length - 1) % gallery.length)}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]"
          >
            ‹
          </button>
          <button
            aria-label="Next photo"
            onClick={() => setGalleryOpen((current) => ((current ?? 0) + 1) % gallery.length)}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]"
          >
            ›
          </button>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
            {galleryOpen + 1} / {gallery.length}
          </span>
        </div>
      )}

      {/* Room photo lightbox — swipe/arrow through one accommodation's photos */}
      {roomGallery && roomPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`${accommodations[roomGallery.accIndex]?.title ?? 'Room'} photos`}>
          <button aria-label="Close photos" onClick={() => setRoomGallery(null)} className="absolute right-5 top-5 z-10 rounded-full bg-white p-2 text-black hover:bg-[#f5f7fa]">
            <X size={20} />
          </button>
          <div className="relative h-[80vh] w-full max-w-[1180px]">
            <Image src={roomPhotos[roomGallery.photoIndex]} alt={`${accommodations[roomGallery.accIndex]?.title ?? 'Room'} photo ${roomGallery.photoIndex + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          {roomPhotos.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={() => setRoomGallery((current) => current ? { ...current, photoIndex: (current.photoIndex + roomPhotos.length - 1) % roomPhotos.length } : current)}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]"
              >
                ‹
              </button>
              <button
                aria-label="Next photo"
                onClick={() => setRoomGallery((current) => current ? { ...current, photoIndex: (current.photoIndex + 1) % roomPhotos.length } : current)}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 text-black hover:bg-[#f5f7fa]"
              >
                ›
              </button>
            </>
          )}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
            {accommodations[roomGallery.accIndex]?.title} · {roomGallery.photoIndex + 1} / {roomPhotos.length}
          </span>
        </div>
      )}

      {/* WhatsApp bedroom enquiry popup (bedroom picker + prefilled message) */}
      <StayWhatsAppEnquiryModal stay={stay} open={enquiryOpen} onClose={() => setEnquiryOpen(false)} pickupRoutes={pickupRoutes} pickupUnavailable={pickupUnavailable} pickup={pickup} onPickupChange={setPickupSelection} />

      {/* Mobile bottom static bar: price + Add-to-trip shortcut, sticky to screen */}
      {isMobile && stay.category === 'stay' && (
        <StayBottomBar slug={stay.slug} price={stay.price} basePrice={basePrice} fullyBooked={Boolean(stay.fullyBooked)} onEnquire={() => setEnquiryOpen(true)} />
      )}
    </div>
  );
}

type AccommodationCardData = { title: string; description: string; image: string; images?: string[]; price?: number | null; bedrooms: number; beds: number };

function photosOf(acc?: AccommodationCardData | null): string[] {
  if (!acc) return [];
  return [...new Set([acc.image, ...(acc.images ?? [])])].filter(Boolean);
}

function AccommodationCard({ acc, onOpen }: { acc: AccommodationCardData; onOpen: (photoIndex: number) => void }) {
  const photos = photosOf(acc);
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const go = (delta: number) => setPhotoIndex((current) => (current + delta + photos.length) % photos.length);
  return (
    <div data-acc-card className="w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#e5e7eb] bg-white sm:w-[250px]">
      <div
        className="relative h-36 w-full touch-pan-y bg-[#eef3f0] sm:h-40"
        onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null || photos.length < 2) return;
          const deltaX = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(deltaX) > 40) go(deltaX < 0 ? 1 : -1);
        }}
      >
        {photos.length > 0 ? (
          <button type="button" aria-label={`Open ${acc.title} photos`} onClick={() => onOpen(Math.min(photoIndex, photos.length - 1))} className="absolute inset-0 block cursor-zoom-in">
            <Image src={photos[photoIndex]} alt={acc.title} fill sizes="(max-width: 640px) 220px, 250px" unoptimized className="object-cover" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-[#24584a]">
            <BedDouble size={30} strokeWidth={1.6} />
          </div>
        )}
        {acc.price != null && acc.price > 0 && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-[#173f35] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(7,26,21,.35)] sm:text-xs">
            ₹{acc.price.toLocaleString('en-IN')} <span className="font-medium text-white/80">/ night</span>
          </span>
        )}
        {photos.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); go(-1); }} className="absolute left-1.5 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white">
              <ChevronLeft size={15} />
            </button>
            <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); go(1); }} className="absolute right-1.5 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#23332e] shadow-sm transition hover:bg-white">
              <ChevronRight size={15} />
            </button>
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {photos.map((_, dotIndex) => (
                <span key={dotIndex} className={`h-1.5 w-1.5 rounded-full transition ${dotIndex === photoIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-sm font-bold text-[#23332e] sm:text-base">{acc.title}</p>
        <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-[#536274] sm:text-[13px]">
          {acc.description.trim() && (
            <li className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full border border-[#8aa0b5]" />
              <span>{acc.description.trim()}</span>
            </li>
          )}
          {(acc.bedrooms > 0 || acc.beds > 0) && (
            <li className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full border border-[#8aa0b5]" />
              <span>
                {[
                  acc.bedrooms > 0 ? `${acc.bedrooms} Bedroom${acc.bedrooms > 1 ? 's' : ''}` : '',
                  acc.beds > 0 ? `${acc.beds} Bed${acc.beds > 1 ? 's' : ''}` : '',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

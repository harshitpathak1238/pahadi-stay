'use client'

import type { PublicRide } from '@/lib/rides';
import { RideBottomBar } from '@/components/public/RideBottomBar';
import { RideWhatsAppEnquiryModal } from '@/components/public/RideWhatsAppEnquiry';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useRideEnquiry } from '@/lib/ride-enquiry-context';

export function RideDetailClient({ ride, degraded }: { ride: PublicRide; degraded?: boolean }) {
  const { open: enquiryOpen, setOpen: setEnquiryOpen } = useRideEnquiry();
  const isMobile = useIsMobile();
  const minPrice = ride.minFare ?? ride.fares?.[0]?.price ?? 0;

  return (
    <>
      {/* Mounted only below the md breakpoint. `useIsMobile()` is false on the
          server AND on the client's first render, so hydration always matches;
          it flips after mount (same pattern as StayDetailExperience). */}
      {isMobile && (
        <RideBottomBar price={minPrice} slug={ride.slug} onEnquire={() => setEnquiryOpen(true)} />
      )}
      <RideWhatsAppEnquiryModal ride={ride} open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </>
  );
}


use client;

import { useState } from "react";
import type { PublicRide } from "@/lib/rides";
import { RideBottomBar } from "@/components/public/RideBottomBar";
import { RideWhatsAppEnquiryModal } from "@/components/public/RideWhatsAppEnquiry";

export function RideDetailClient({ ride, degraded }: { ride: PublicRide; degraded?: boolean }) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const minPrice = ride.minFare ?? ride.fares?.[0]?.price ?? 0;

  return (
    <>
      <RideBottomBar price={minPrice} slug={ride.slug} onEnquire={() => setEnquiryOpen(true)} />
      <RideWhatsAppEnquiryModal ride={ride} open={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </>
  );
}


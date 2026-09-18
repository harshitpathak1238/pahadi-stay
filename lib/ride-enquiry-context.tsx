'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

/**
 * Small shared state that lets the ride detail page's desktop sidebar button
 * (`FareBookingSection`) and the mobile sticky bottom bar (`RideBottomBar`)
 * both open the same `RideWhatsAppEnquiryModal` — mirroring the stays page
 * pattern where `StayEnquireButton` + `StayBottomBar` share one `enquiryOpen`.
 */
export function RideEnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useRideEnquiry() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRideEnquiry must be used within RideEnquiryProvider');
  return ctx;
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Compass, Home, Sparkles } from 'lucide-react';

const categories = [['stays', 'Stays', Home], ['rides', 'Rides', Compass], ['rentals', 'Rentals', Bike], ['activities', 'Activities', Sparkles]] as const;

export function CategoryTabs({ navigate = false }: { navigate?: boolean }) {
  const [active, setActive] = useState('stays');
  const router = useRouter();
  return <div className="category-tabs flex gap-2 overflow-x-auto" role="tablist" aria-label="Travel categories">{categories.map(([key, label, Icon]) => <button key={key} type="button" role="tab" aria-selected={active === key} onClick={() => { setActive(key); if (navigate) router.push(`/${key}`); }} className={`sans inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${active === key ? 'bg-[#d6a06d] text-[#173f35] shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'}`}><Icon size={16} strokeWidth={2}/>{label}</button>)}</div>;
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Compass, Home, Sparkles } from 'lucide-react';

const categories = [['stays', 'Stays', Home], ['rides', 'Rides', Compass], ['rentals', 'Rentals', Bike], ['activities', 'Activities', Sparkles]] as const;

export function CategoryTabs({ navigate = false }: { navigate?: boolean }) {
  const [active, setActive] = useState('stays');
  const router = useRouter();
  return <div className="category-tabs-shell" role="tablist" aria-label="Travel categories"><div className="category-tabs flex gap-1.5 overflow-x-auto">{categories.map(([key, label, Icon]) => <button key={key} type="button" role="tab" aria-selected={active === key} onClick={() => { setActive(key); if (navigate) router.push(`/${key}`); }} className={`category-tab sans inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${active === key ? 'category-tab-active' : ''}`}><span className="category-tab-icon"><Icon size={16} strokeWidth={2}/></span>{label}{active === key && <span className="category-tab-dot" aria-hidden="true" />}</button>)}</div></div>;
}

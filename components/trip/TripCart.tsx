'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ShoppingBag, Trash2 } from 'lucide-react';

export type TripCartItem = {
  key: string;
  slug: string;
  title: string;
  category: 'STAY' | 'RIDE' | 'RENTAL' | 'ACTIVITY';
  price: number;
  startDate: string;
  endDate?: string;
  pickup?: { location: string; detail?: string; requestedTime?: string; price?: number };
  addons?: string[];
  addonBreakdown?: Array<{ id: string; label: string; amount: number; quantity?: number }>;
  rentalType?: 'BIKE' | 'SCOOTY';
  quantity?: number;
};

type CartContext = {
  items: TripCartItem[];
  addItem: (item: TripCartItem) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CART_KEY = 'kainchi-trip-cart';
const TripCartContext = createContext<CartContext | null>(null);

export function TripCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TripCartItem[]>([]);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(CART_KEY) || '[]'));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: TripCartItem) => {
    setItems((current) => (current.some((existing) => existing.key === item.key) ? current : [...current, item]));
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  return (
    <TripCartContext.Provider value={{ items, addItem, removeItem, clear: () => setItems([]) }}>
      {children}
    </TripCartContext.Provider>
  );
}

export function useTripCart() {
  const context = useContext(TripCartContext);
  if (!context) throw new Error('useTripCart must be used inside TripCartProvider');
  return context;
}

export function TripSummary() {
  const { items, removeItem } = useTripCart();
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (!items.length) return null;

  return (
    <aside className="fixed inset-x-3 bottom-4 z-40 rounded-2xl border border-[#b7d8c6] bg-white p-4 shadow-[0_8px_24px_rgba(23,63,53,.16)] md:inset-auto md:bottom-6 md:right-6 md:w-80">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-2 text-[#173f35]"><ShoppingBag size={19} className="animate-pulse" /><strong>Your trip · {items.length} {items.length === 1 ? 'item' : 'items'}</strong></span>
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#e9f1ec] px-2 sans text-xs font-bold text-[#24584a] shadow-sm">{items.length}</span>
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={18} />
      </button>
      {open && <div className="mt-3 grid gap-2 border-t border-[#e4e3da] pt-3">
        {items.map((item) => <div className="flex items-start justify-between gap-3 sans text-sm" key={item.key}>
          <span className="min-w-0"><span className="block truncate font-bold text-[#173f35]">{item.title}</span><span className="text-xs text-[#6c7770]">{item.quantity ? `${item.quantity} × ` : ''}₹{item.price.toLocaleString('en-IN')}</span></span>
          <button type="button" onClick={() => removeItem(item.key)} aria-label={`Remove ${item.title}`} className="text-[#9f5938]"><Trash2 size={15} /></button>
        </div>)}
        <div className="mt-2 flex items-center justify-between border-t border-[#e4e3da] pt-3 sans font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
      </div>}
      <Link href="/checkout" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b66b45] px-4 py-3 sans text-sm font-bold text-white transition hover:bg-[#9f5938]">Review trip <ArrowRight size={16} /></Link>
    </aside>
  );
}

export function AddToTrip({ item, disabled = false, label }: { item: Omit<TripCartItem, 'key'>; disabled?: boolean; label?: string }) {
  const { addItem, items } = useTripCart();
  const key = `${item.category}:${item.slug}:${item.startDate}:${item.rentalType || ''}:${item.quantity || 1}`;
  const added = items.some((existing) => existing.key === key);

  return <button type="button" onClick={() => addItem({ ...item, key })} disabled={disabled || added} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#24584a] bg-white px-4 py-3 sans text-sm font-bold text-[#24584a] transition hover:bg-[#e7eadf] disabled:cursor-not-allowed disabled:opacity-60">{label || (added ? 'Added to your trip' : 'Add to your trip')}</button>;
}

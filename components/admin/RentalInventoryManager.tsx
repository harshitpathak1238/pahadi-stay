'use client';

import { useEffect, useState } from 'react';

type Rental = { id: string; title: string; bikeQuantity: number; scootyQuantity: number };

export function RentalInventoryManager() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [message, setMessage] = useState('Loading rental inventory...');
  const [busy, setBusy] = useState('');
  useEffect(() => { fetch('/api/admin/listings?category=RENTAL').then(async (response) => { if (!response.ok) throw new Error('Could not load rental inventory.'); setRentals(await response.json()); setMessage(''); }).catch((error) => setMessage(error.message)); }, []);
  const update = async (rental: Rental, field: 'bikeQuantity' | 'scootyQuantity', value: string) => { const quantity = Math.max(0, Number(value) || 0); setRentals((current) => current.map((item) => item.id === rental.id ? { ...item, [field]: quantity } : item)); setBusy(`${rental.id}:${field}`); const response = await fetch(`/api/admin/listings/${rental.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: quantity }) }); setBusy(''); if (!response.ok) setMessage('Could not save this quantity.'); };
  return <section className="rounded-2xl border border-[#dfe3d8] bg-white p-5 md:p-7"><p className="sans text-xs font-bold uppercase tracking-[.16em] text-[#b66b45]">Rental operations</p><h2 className="mt-2 text-2xl text-[#173f35]">Available vehicles</h2><p className="mt-1 sans text-sm text-[#6c7770]">Set the maximum bikes and scooties guests can reserve.</p>{message && <p className="mt-4 sans text-sm text-[#6c7770]">{message}</p>}<div className="mt-5 divide-y divide-[#e4e3da]">{rentals.map((rental) => <div key={rental.id} className="grid gap-3 py-4 md:grid-cols-[1fr_160px_160px] md:items-end"><strong className="text-[#173f35]">{rental.title}</strong><Field label="Bikes" value={rental.bikeQuantity} busy={busy === `${rental.id}:bikeQuantity`} onChange={(value) => update(rental, 'bikeQuantity', value)} /><Field label="Scooties" value={rental.scootyQuantity} busy={busy === `${rental.id}:scootyQuantity`} onChange={(value) => update(rental, 'scootyQuantity', value)} /></div>)}</div></section>;
}

function Field({ label, value, busy, onChange }: { label: string; value: number; busy: boolean; onChange: (value: string) => void }) { return <label className="grid gap-1 sans text-xs font-bold text-[#173f35]">{label}<input type="number" min="0" value={value} disabled={busy} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[#d6d9d1] bg-white p-2.5 text-sm" /></label>; }

'use client';
import { X } from 'lucide-react';
import { REVIEW_CATEGORIES } from '@/lib/reviews';
import type { FormState, StayOption } from './reviewParts';

type Props = { form: FormState; editing: boolean; stays: StayOption[]; busy: boolean; onChange: (k: keyof FormState, v: string | boolean) => void; onClose: () => void; onSave: (e: React.FormEvent) => void };
const numKeys: { key: 'staff' | 'facilities' | 'cleanliness' | 'comfort' | 'valueForMoney' | 'location'; label: string }[] = REVIEW_CATEGORIES.map((c) => ({ key: c.key, label: c.label }));

export function ReviewDialog(p: Props) {
  const { form, editing, stays, busy } = p;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={editing ? 'Edit review' : 'Add review'}>
      <form onSubmit={p.onSave} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[4px] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{editing ? 'Edit review' : 'Add review'}</h2>
          <button type="button" aria-label="Close" onClick={p.onClose} className="rounded p-2 hover:bg-[#f5f5f5]"><X size={16} /></button>
        </div>
        {!editing && (
          <label className="mt-4 grid gap-1.5 text-[12px] font-semibold">Stay *
            <select value={form.listingId} onChange={(e) => p.onChange('listingId', e.target.value)} required className="h-9 rounded-[4px] border border-[#c9c9cc] px-3 font-normal">
              <option value="">Choose a stay</option>
              {stays.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[12px] font-semibold">Guest name *
            <input value={form.guestName} onChange={(e) => p.onChange('guestName', e.target.value)} required className="h-9 rounded-[4px] border border-[#c9c9cc] px-3 font-normal" />
          </label>
          <label className="grid gap-1.5 text-[12px] font-semibold">Guest email
            <input type="email" value={form.guestEmail} onChange={(e) => p.onChange('guestEmail', e.target.value)} className="h-9 rounded-[4px] border border-[#c9c9cc] px-3 font-normal" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {numKeys.map(({ key, label }) => (
            <label key={key} className="grid gap-1.5 text-[12px] font-semibold">{label} (1–10)
              <input type="number" min={1} max={10} step={0.5} value={form[key]} onChange={(e) => p.onChange(key, e.target.value)} placeholder="—" className="h-9 rounded-[4px] border border-[#c9c9cc] px-3 font-normal" />
            </label>
          ))}
        </div>
        <label className="mt-4 grid gap-1.5 text-[12px] font-semibold">Review *
          <textarea value={form.comment} onChange={(e) => p.onChange('comment', e.target.value)} required rows={4} className="rounded-[4px] border border-[#c9c9cc] p-3 font-normal" />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] font-semibold">
          <label className="flex items-center gap-2">Status
            <select value={form.status} onChange={(e) => p.onChange('status', e.target.value)} className="h-9 rounded-[4px] border border-[#c9c9cc] px-3">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isVerified} onChange={(e) => p.onChange('isVerified', e.target.checked)} className="accent-[#16704a]" />
            Verified guest
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={p.onClose} className="h-9 rounded-[4px] border border-[#c9c9cc] px-4 text-[12px] font-semibold">Cancel</button>
          <button disabled={busy} className="h-9 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white">{busy ? 'Saving…' : 'Save review'}</button>
        </div>
      </form>
    </div>
  );
}

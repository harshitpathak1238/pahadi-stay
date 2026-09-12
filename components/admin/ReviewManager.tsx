'use client';
import { useEffect, useState } from 'react';
import { MessageSquareHeart, RefreshCw, Search, Plus } from 'lucide-react';
import { emptyForm } from './reviewParts';
import type { FormState, ReviewRow, StayOption } from './reviewParts';
import { ReviewRows } from './reviewRows';
import { ReviewDialog } from './reviewDialog';

export function ReviewManager() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [stays, setStays] = useState<StayOption[]>([]);
  const [listingId, setListingId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/reviews?listingId=${listingId}&status=${status}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Reviews could not be loaded.');
      const result = await res.json();
      setRows(result.reviews);
      setStays(result.listings);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Reviews could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [listingId, status]);
  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.guestName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)) : rows;
  const act = async (id: string, patch: Record<string, unknown>) => {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    if (!res.ok) setMessage('That action failed.');
    setBusy(false);
    await load();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    await load();
  };
  const openEdit = (row: ReviewRow) => {
    setEditingId(row.id);
    setForm({ listingId: row.listingId, guestName: row.guestName, guestEmail: row.guestEmail ?? '', comment: row.comment, status: row.status, isVerified: row.isVerified, staff: row.staff?.toString() ?? '', facilities: row.facilities?.toString() ?? '', cleanliness: row.cleanliness?.toString() ?? '', comfort: row.comfort?.toString() ?? '', valueForMoney: row.valueForMoney?.toString() ?? '', location: row.location?.toString() ?? '' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || busy) return;
    setBusy(true);
    const num = (v: string) => (v === '' ? null : Number(v));
    const payload = { ...(editingId ? {} : { listingId: form.listingId }), guestName: form.guestName, guestEmail: form.guestEmail || null, comment: form.comment, status: form.status, isVerified: form.isVerified, staff: num(form.staff), facilities: num(form.facilities), cleanliness: num(form.cleanliness), comfort: num(form.comfort), valueForMoney: num(form.valueForMoney), location: num(form.location) };
    const res = await fetch(editingId ? `/api/admin/reviews/${editingId}` : '/api/admin/reviews', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) setMessage('Could not save this review.');
    else {
      setForm(null);
      setEditingId(null);
    }
    setBusy(false);
    await load();
  };
  const close = () => { setForm(null); setEditingId(null); };
  const change = (key: keyof FormState, value: string | boolean) => setForm((c) => (c ? { ...c, [key]: value } : c));
  return (
    <div className="admin-shell min-h-screen bg-[#f6f6f7] p-4 text-[#303030] md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-[#777]"><MessageSquareHeart size={15} /> Operations</p>
            <h1 className="mt-2 text-[26px] font-semibold">Reviews</h1>
            <p className="mt-1 text-[13px] text-[#777]">Moderate guest reviews — pending items appear first.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-[#c9c9cc] bg-white px-4 text-[12px] font-semibold"><RefreshCw size={14} /> Refresh</button>
            <button onClick={() => { setEditingId(null); setForm(emptyForm(listingId)); }} className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white"><Plus size={14} /> Add review</button>
          </div>
        </div>
        {message && <p className="mt-4 rounded-[4px] border border-[#e7b5a6] bg-[#fff3ef] p-3 text-[13px] text-[#9f3d3d]">{message}</p>}
        <section className="mt-6 rounded-[4px] border border-[#e1e1e3] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#ededed] p-4 md:flex-row">
            <label className="flex h-9 flex-1 items-center gap-2 rounded-[4px] border border-[#c9c9cc] px-3"><Search size={15} className="text-[#777]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest or comment" className="w-full text-[12px] outline-none" /></label>
            <select value={listingId} onChange={(e) => setListingId(e.target.value)} className="h-9 rounded-[4px] border border-[#c9c9cc] bg-white px-3 text-[12px]">
              <option value="">All stays</option>
              {stays.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-[4px] border border-[#c9c9cc] bg-white px-3 text-[12px]">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <ReviewRows rows={filtered} loading={loading} busy={busy} onAct={act} onEdit={openEdit} onDelete={remove} />
        </section>
        {form && <ReviewDialog form={form} editing={Boolean(editingId)} stays={stays} busy={busy} onChange={change} onClose={close} onSave={save} />}
      </div>
    </div>
  );
}
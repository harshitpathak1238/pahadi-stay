'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Star, Trash2, X } from 'lucide-react';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type AdminReview = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  overallRating: number;
  comment: string;
  status: ReviewStatus;
  isVerified: boolean;
  createdAt: string;
};
type FormState = { guestName: string; guestEmail: string; overallRating: string; comment: string; status: ReviewStatus };
type Filter = 'ALL' | ReviewStatus;

const emptyForm: FormState = { guestName: '', guestEmail: '', overallRating: '5', comment: '', status: 'APPROVED' };
const filters: Filter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const statusBadge: Record<ReviewStatus, string> = {
  PENDING: 'bg-[#fdf3e0] text-[#8a5a00]',
  APPROVED: 'bg-[#e8f5ee] text-[#16704a]',
  REJECTED: 'bg-[#fdeaea] text-[#a44a4a]',
};

// Portal-based reviews popup for one stay — opened from the stay editor's
// "Guest reviews" panel. Each action (add/edit/approve/reject/delete) is its
// own API call against the existing /api/admin/reviews endpoints, so nothing
// here touches the stay form's unsaved changes or its Save button.
export function StayReviewsModal({ listingId, stayTitle, onClose }: { listingId: string; stayTitle: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews?listingId=${encodeURIComponent(listingId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load reviews.');
      setReviews(data.reviews as AdminReview[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (mounted) load();
  }, [mounted, load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pendingCount = reviews.filter((review) => review.status === 'PENDING').length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        listingId,
        guestName: form.guestName,
        guestEmail: form.guestEmail || null,
        overallRating: Number(form.overallRating) || 5,
        comment: form.comment,
        status: form.status,
      };
      const response = await fetch(editingId ? `/api/admin/reviews/${editingId}` : '/api/admin/reviews', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this review.');
      await load();
      setForm(null);
      setEditingId(null);
      setFilter('ALL');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this review.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: ReviewStatus) => {
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Could not ${status === 'APPROVED' ? 'approve' : 'reject'} this review.`);
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update status.');
    }
  };

  const remove = async (id: string) => {
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data as { error?: string }).error || 'Could not delete this review.');
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not delete this review.');
    }
  };

  const startEdit = (review: AdminReview) => {
    setEditingId(review.id);
    setForm({ guestName: review.guestName, guestEmail: review.guestEmail ?? '', overallRating: String(review.overallRating), comment: review.comment, status: review.status });
    setFilter('ALL');
  };

  const portal = mounted ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e9ef] px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#0071c2]"><Star size={14} /> Stay editor</p>
            <h2 className="mt-1 text-lg font-bold text-[#1a2b24] sm:text-xl">{stayTitle} — guest reviews</h2>
            <p className="mt-0.5 text-xs text-[#536274]">{pendingCount > 0 ? `${pendingCount} pending review${pendingCount === 1 ? '' : 's'} need moderation.` : 'No pending reviews to moderate.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close reviews panel" className="rounded-full p-2 text-[#536274] transition hover:bg-[#f0f3f6]"><X size={18} /></button>
        </div>

        {/* Toolbar: filters + add */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === item ? 'bg-[#1a2b24] text-white' : 'bg-[#f0f3f6] text-[#3a4a42] hover:bg-[#e4e9ef]'}`}>
                {item === 'ALL' ? `All (${reviews.length})` : item === 'PENDING' ? `Pending (${pendingCount})` : item === 'APPROVED' ? `Approved (${reviews.filter((review) => review.status === 'APPROVED').length})` : `Rejected (${reviews.filter((review) => review.status === 'REJECTED').length})`}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setFilter('ALL'); }} className="flex items-center gap-1.5 rounded-full bg-[#0071c2] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#005a9e]"><Plus size={14} /> Add review</button>
        </div>

        {error && <p className="mx-5 mb-3 rounded-lg bg-[#fdeaea] px-3 py-2 text-xs font-semibold text-[#a44a4a]">{error}</p>}

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* ---RENDER-FORM-LIST--- */}
          {form && (
            <form onSubmit={submit} className="mb-4 rounded-xl border border-[#e4e9ef] bg-[#fafbfc] p-4">
              <p className="text-sm font-bold text-[#1a2b24]">{editingId ? 'Edit review' : 'New review'}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-bold text-[#3a4a42]">Guest name
                  <input required value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} className="rounded-lg border border-[#d7dee6] px-3 py-2 text-sm font-normal text-[#1a2b24] outline-none focus:border-[#0071c2]" placeholder="e.g. Priya Sharma" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[#3a4a42]">Guest email (optional)
                  <input type="email" value={form.guestEmail} onChange={(event) => setForm({ ...form, guestEmail: event.target.value })} className="rounded-lg border border-[#d7dee6] px-3 py-2 text-sm font-normal text-[#1a2b24] outline-none focus:border-[#0071c2]" placeholder="guest@example.com" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-[#3a4a42]">Rating (1–5)
                  <select value={form.overallRating} onChange={(event) => setForm({ ...form, overallRating: event.target.value })} className="rounded-lg border border-[#d7dee6] px-3 py-2 text-sm font-normal text-[#1a2b24] outline-none focus:border-[#0071c2]">
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-[#3a4a42]">Status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ReviewStatus })} className="rounded-lg border border-[#d7dee6] px-3 py-2 text-sm font-normal text-[#1a2b24] outline-none focus:border-[#0071c2]">
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
              </div>
              <label className="mt-3 grid gap-1 text-xs font-bold text-[#3a4a42]">Comment
                <textarea required value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} rows={3} className="rounded-lg border border-[#d7dee6] px-3 py-2 text-sm font-normal text-[#1a2b24] outline-none focus:border-[#0071c2]" placeholder="What did the guest say about this stay?" />
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => { setForm(null); setEditingId(null); }} className="rounded-full px-4 py-2 text-xs font-bold text-[#3a4a42] transition hover:bg-[#eef1f5]">Cancel</button>
                <button type="submit" disabled={busy} className="rounded-full bg-[#1a2b24] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0d1a14] disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Add review'}</button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-[#536274]">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#b9c5d1] py-8 text-center">
              <p className="text-sm font-bold text-[#23332e]">No reviews yet</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-[#536274]">Add a review manually or wait for guests to submit one.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.filter((review) => filter === 'ALL' || review.status === filter).map((review) => (
                <li key={review.id} className="rounded-xl border border-[#e4e9ef] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#1a2b24]">{review.guestName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.08em] ${statusBadge[review.status]}`}>{review.status}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#536274]">{review.guestEmail ?? 'no email'} · {new Date(review.createdAt).toLocaleDateString()}</p>
                      <p className="mt-1.5 text-sm text-[#23332e]">{review.comment}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#fdf3e0] px-2.5 py-1 text-xs font-bold text-[#8a5a00]"><Star size={12} /> {review.overallRating}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#eef1f5] pt-2.5">
                    {review.status !== 'APPROVED' && <button type="button" onClick={() => setStatus(review.id, 'APPROVED')} className="rounded-full bg-[#e8f5ee] px-3 py-1.5 text-xs font-bold text-[#16704a] transition hover:bg-[#d8eee2]">Approve</button>}
                    {review.status !== 'REJECTED' && <button type="button" onClick={() => setStatus(review.id, 'REJECTED')} className="rounded-full bg-[#fdeaea] px-3 py-1.5 text-xs font-bold text-[#a44a4a] transition hover:bg-[#f8dcdc]">Reject</button>}
                    <button type="button" onClick={() => startEdit(review)} className="rounded-full px-3 py-1.5 text-xs font-bold text-[#3a4a42] transition hover:bg-[#eef1f5]">Edit</button>
                    <button type="button" onClick={() => remove(review.id)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-[#a44a4a] transition hover:bg-[#fdeaea]"><Trash2 size={12} /> Delete</button>
                  </div>
                </li>
              ))}
              {reviews.filter((review) => filter === 'ALL' || review.status === filter).length === 0 && <p className="py-6 text-center text-sm text-[#536274]">No reviews match this filter.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  ) : null;
  void portal;
}

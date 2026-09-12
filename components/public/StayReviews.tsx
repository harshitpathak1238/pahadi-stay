'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { REVIEW_CATEGORIES, relativeTime } from '@/lib/reviews';
import type { ApprovedReview, ReviewStats, StayReviewData } from '@/lib/reviews';

type CategoryKey = (typeof REVIEW_CATEGORIES)[number]['key'];
type FormState = { guestName: string; guestEmail: string; comment: string; scores: Record<CategoryKey, number> };

const emptyScores = (): Record<CategoryKey, number> => ({
  staff: 8, facilities: 8, cleanliness: 8, comfort: 8, valueForMoney: 8, location: 8,
});

export function StayReviews({ initial }: { initial: StayReviewData | null }) {
  const [data, setData] = useState<StayReviewData | null>(initial);
  const [visible, setVisible] = useState(6);
  const [formOpen, setFormOpen] = useState(false);
  const [done, setDone] = useState(false);
  const stats: ReviewStats | null = useMemo(() => data?.stats ?? null, [data]);

  useEffect(() => { setData(initial); }, [initial]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('stay-review-count', { detail: { count: data?.reviews.length ?? 0 } }));
  }, [data]);

  return (
    <section id="reviews" className="mt-5 scroll-mt-24 overflow-hidden rounded-lg border border-[#d9e0e8] bg-gradient-to-b from-[#f2f7fb] via-white to-white p-4 sm:p-5 md:p-7">
      <Head stats={stats} />
      {stats ? <Bars stats={stats} /> : <Empty />}
      {data && data.reviews.length > 0 && (
        <div className="mt-4 grid gap-3 sm:mt-6 md:grid-cols-2">
          {data.reviews.slice(0, visible).map((review) => <Card key={review.id} review={review} />)}
        </div>
      )}
      {data && data.reviews.length > visible && (
        <button type="button" onClick={() => setVisible((c) => c + 6)} className="mt-4 w-full rounded-xl border border-[#b9c5d1] bg-white px-4 py-2.5 text-sm font-bold text-[#0071c2] shadow-sm">
          Show more reviews ({data.reviews.length - visible} remaining)
        </button>
      )}
      <div className="mt-5 border-t border-[#e5e7eb] pt-4 sm:mt-6 sm:pt-5">
        {!formOpen && !done && (
          data?.listingId ? (
            <button type="button" onClick={() => setFormOpen(true)} className="rounded bg-[#0071c2] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#005b9d]">
              Write a review
            </button>
          ) : (
            <p className="text-sm text-[#536274]">Reviews are temporarily unavailable — please reload the page and try again.</p>
          )
        )}
        {done && (
          <p role="status" className="rounded border border-[#b9d5c5] bg-[#f1f8f3] p-4 text-sm font-semibold text-[#24584a]">
            Thanks — your review is pending approval and will appear here once a moderator approves it.
          </p>
        )}
        {formOpen && !done && data?.listingId && <Form listingId={data.listingId} onDone={() => { setDone(true); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />}
      </div>
    </section>
  );
}

function Head({ stats }: { stats: ReviewStats | null }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="sans text-[11px] font-bold uppercase tracking-[.16em] text-[#0071c2]">Guest reviews</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{stats ? `Loved by guests (${stats.count})` : 'Be the first to review'}</h2>
        <p className="mt-1 text-xs text-[#536274] sm:text-sm">{stats ? 'Real reviews from recent verified stays.' : 'No verified reviews yet — yours could be the first story here.'}</p>
      </div>
      {stats && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#003b95] p-3 pr-4 text-white shadow-[0_10px_24px_rgba(0,59,149,.28)] sm:p-4 sm:pr-5" aria-label={`Rated ${stats.overall5.toFixed(1)} of 5: ${stats.label}`}>
          <strong className="text-3xl leading-none sm:text-4xl">{stats.overall5.toFixed(1)}</strong>
          <span className="leading-tight">
            <span className="block text-sm font-bold">{stats.label}</span>
            <span className="mt-0.5 block text-[11px] opacity-80">{stats.count} review{stats.count === 1 ? '' : 's'}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Bars({ stats }: { stats: ReviewStats }) {
  return (
    <div className="mt-4 grid gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-2">
      {stats.categories.map(({ key, label, avg }) => (
        <div key={key} className="rounded-xl border border-[#e7edf3] bg-white/80 px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3">
          <p className="flex items-center justify-between gap-2 text-xs font-semibold text-[#23332e] sm:text-sm"><span>{label}</span><span className="tabular-nums text-[#0071c2]">{avg.toFixed(1)}</span></p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e7edf3]" role="img" aria-label={`${label} rated ${avg.toFixed(1)} out of 10`}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#0071c2] to-[#00a862]" style={{ width: `${Math.max(0, Math.min(100, avg * 10))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Empty() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#b9c5d1] bg-white/70 p-5 text-center sm:mt-6 sm:p-6">
      <p className="text-sm font-bold text-[#23332e]">No guest reviews yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#536274] sm:text-sm sm:leading-6">Stayed here recently? Share the first review and help future travellers choose with confidence.</p>
    </div>
  );
}

function Card({ review }: { review: ApprovedReview }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 text-sm text-[#536274] shadow-[0_8px_20px_rgba(15,40,70,.06)] sm:p-5">
      <p className="flex flex-wrap items-center gap-1.5 font-bold text-[#23332e]">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eef3ef] text-xs text-[#24584a]">{review.guestName.charAt(0).toUpperCase()}</span>
        {review.guestName}
        {review.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7ee] px-2 py-0.5 text-[11px] font-bold text-[#16704a]"><ShieldCheck size={12} />Verified guest</span>}
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#8a94a3]">
        <span className="inline-flex items-center gap-1 font-bold text-[#f59e0b]"><Star size={12} fill="currentColor" />{review.overallRating.toFixed(1)}</span>
        <span aria-hidden="true">·</span>
        <span>{relativeTime(review.createdAt)}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-[#23332e]">{review.comment}</p>
    </div>
  );
}

function Form({ listingId, onDone, onCancel }: { listingId?: string; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>({ guestName: '', guestEmail: '', comment: '', scores: emptyScores() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setScore = (key: CategoryKey, value: number) => setForm((current) => ({ ...current, scores: { ...current.scores, [key]: value } }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, guestName: form.guestName, guestEmail: form.guestEmail || undefined, comment: form.comment, ...form.scores, website: '' }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Your review could not be submitted. Please try again.');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your review could not be submitted. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <h3 className="text-lg font-bold">Share your stay</h3>
      <input type="text" name="website" autoComplete="off" tabIndex={-1} className="hidden" aria-hidden="true" defaultValue="" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold">Your name *
          <input value={form.guestName} onChange={(e) => setForm((c) => ({ ...c, guestName: e.target.value }))} required minLength={2} maxLength={80} placeholder="e.g. Priya Sharma" className="rounded border border-[#b9c5d1] p-2.5 font-normal" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">Email <span className="font-normal text-[#8a94a3]">(optional, moderation only)</span>
          <input type="email" value={form.guestEmail} onChange={(e) => setForm((c) => ({ ...c, guestEmail: e.target.value }))} placeholder="you@example.com" className="rounded border border-[#b9c5d1] p-2.5 font-normal" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {REVIEW_CATEGORIES.map(({ key, label }) => (
          <label key={key} className="grid gap-1.5 text-sm font-bold">
            <span className="flex items-center justify-between">{label}
              <span className="inline-flex items-center gap-1 font-normal text-[#f59e0b]"><Star size={13} fill="currentColor" /> {form.scores[key].toFixed(1)}</span>
            </span>
            <input type="range" min={1} max={10} step={0.5} value={form.scores[key]} onChange={(e) => setScore(key, Number(e.target.value))} aria-label={`Rate ${label} from 1 to 10`} className="w-full accent-[#0071c2]" />
          </label>
        ))}
      </div>
      <label className="grid gap-1.5 text-sm font-bold">Your review * <span className="font-normal text-[#8a94a3]">(10 to 2000 characters)</span>
        <textarea value={form.comment} onChange={(e) => setForm((c) => ({ ...c, comment: e.target.value }))} required minLength={10} maxLength={2000} rows={4} placeholder="What did you love? What should future guests know?" className="rounded border border-[#b9c5d1] p-2.5 font-normal" />
      </label>
      {error && <p role="alert" className="rounded border border-[#e7b5a6] bg-[#fff3ef] p-3 text-sm font-semibold text-[#9f3d3d]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded bg-[#0071c2] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Submitting…' : 'Submit review'}</button>
        <button type="button" onClick={onCancel} className="rounded border border-[#b9c5d1] px-5 py-2.5 text-sm font-bold">Cancel</button>
      </div>
      <p className="text-xs text-[#8a94a3]">Reviews are moderated before they appear publicly.</p>
    </form>
  );
}
'use client';
import { ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import { badge } from './reviewParts';
import type { ReviewRow } from './reviewParts';

export function ReviewRows(p: { rows: ReviewRow[]; loading: boolean; busy: boolean; onAct: (id: string, patch: Record<string, unknown>) => void; onEdit: (row: ReviewRow) => void; onDelete: (id: string) => void }) {
  if (p.loading) return <div className="space-y-3 p-5">{[1, 2, 3].map((i) => <div className="h-12 animate-pulse rounded-[4px] bg-[#ededee]" key={i} />)}</div>;
  if (!p.rows.length) return <p className="p-10 text-center text-[13px] text-[#777]">No reviews match these filters.</p>;
  return (
    <ul className="divide-y divide-[#ededed]">
      {p.rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">{row.guestName}
              <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-semibold ${badge[row.status]}`}>{row.status}</span>
              {row.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[11px] font-semibold text-[#16704a]"><ShieldCheck size={11} /> Verified guest</span>}
              <span className="rounded-[4px] bg-[#eef2f6] px-2 py-0.5 text-[11px] font-semibold">{row.overallRating.toFixed(1)}/5</span>
            </p>
            <p className="mt-1 text-[12px] text-[#777]">{row.listing?.title ?? row.listingId} · {new Date(row.createdAt).toLocaleString('en-IN')}</p>
            <p className="mt-2 max-w-2xl text-[13px] leading-6">{row.comment.length > 180 ? row.comment.slice(0, 180) + '…' : row.comment}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {row.status !== 'APPROVED' && <button disabled={p.busy} onClick={() => p.onAct(row.id, { status: 'APPROVED' })} className="h-8 rounded-[4px] bg-[#16704a] px-3 text-[11px] font-semibold text-white">Approve</button>}
            {row.status !== 'REJECTED' && <button disabled={p.busy} onClick={() => p.onAct(row.id, { status: 'REJECTED' })} className="h-8 rounded-[4px] border border-[#c9c9cc] px-3 text-[11px] font-semibold">Reject</button>}
            <button onClick={() => p.onEdit(row)} className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#c9c9cc] px-3 text-[11px] font-semibold"><Pencil size={12} /> Edit</button>
            <button onClick={() => p.onDelete(row.id)} className="inline-flex h-8 items-center gap-1 rounded-[4px] border border-[#e7b5a6] px-3 text-[11px] font-semibold text-[#9f3d3d]"><Trash2 size={12} /> Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

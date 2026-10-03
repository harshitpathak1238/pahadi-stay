'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
type Analytics = { timeline: { date: string; revenue: number; margin: number }[]; categories: { category: string; bookings: number; revenue: number; margin: number }[]; funnel: { status: string; trips: number }[]; topListings: { id: string; title: string; bookings: number; revenue: number }[] };

export type AnalyticsData = Analytics;

/**
 * Fetches analytics data and renders the page frame. The charts live in a
 * separate module (`AnalyticsCharts`) so this shell stays readable; Recharts
 * itself is only pulled in when this route is visited, because it is imported
 * by nothing else in the app.
 */
export function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(''); try { const response = await fetch('/api/admin/analytics', { cache: 'no-store' }); if (!response.ok) throw new Error('Analytics data could not be loaded.'); setData(await response.json()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Analytics data could not be loaded.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="admin-shell min-h-screen bg-[#f6f6f7] p-4 text-[#303030] md:p-8"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#777]">Operations</p><h1 className="mt-2 text-[26px] font-semibold">Analytics</h1><p className="mt-1 text-[13px] text-[#777]">Revenue, margin, category mix, and booking conversion.</p></div><button onClick={load} className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-[#303030] px-4 text-[12px] font-semibold text-white"><RefreshCw size={14} /> Refresh</button></div>{error && <div className="mt-6 flex items-center gap-2 rounded-[4px] border border-[#f0caca] bg-[#fff5f5] p-3 text-[12px] text-[#a33a3a]"><AlertCircle size={15} />{error}</div>}{loading ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{[1, 2, 3, 4].map((item) => <div className="h-72 animate-pulse rounded-[4px] bg-[#e5e5e7]" key={item} />)}</div> : data && <AnalyticsCharts data={data} />}</div></div>;
}

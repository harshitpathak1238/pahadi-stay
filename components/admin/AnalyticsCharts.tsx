'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { AnalyticsData } from '@/components/admin/AdminAnalyticsPage';

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const colors = ['#303030', '#6b7280', '#9ca3af', '#c4c7cc', '#e5e7eb'];

function ChartCard({ title, wide, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  return <section className={`rounded-[4px] border border-[#e1e1e3] bg-white p-4 md:p-5 ${wide ? 'lg:col-span-2' : ''}`}><div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold">{title}</h2><BarChart3 size={16} className="text-[#777]" /></div><div className="mt-4 h-[280px] w-full">{children}</div></section>;
}

/**
 * Recharts is the single heaviest dependency in the admin area (~120 kB
 * gzipped). It is split into its own module and loaded on demand so visiting
 * any other admin page never downloads it.
 */
export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
<ChartCard title="Revenue and margin · last 30 days" wide><ResponsiveContainer width="100%" height={280}><AreaChart data={data.timeline}><CartesianGrid stroke="#eeeeef" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(value) => value.slice(5)} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#303030" fill="#dfe1e4" strokeWidth={2} /><Area type="monotone" dataKey="margin" name="Margin" stroke="#16704a" fill="#e8f5ee" strokeWidth={2} /></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="Bookings by category"><ResponsiveContainer width="100%" height={280}><BarChart data={data.categories} layout="vertical" margin={{ left: 12, right: 12 }}><CartesianGrid stroke="#eeeeef" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={70} /><Tooltip /><Bar dataKey="bookings" name="Bookings" fill="#303030" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Category revenue"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data.categories} dataKey="revenue" nameKey="category" cx="50%" cy="45%" innerRadius={62} outerRadius={98} paddingAngle={2}>{data.categories.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /><Legend /></PieChart></ResponsiveContainer></ChartCard><ChartCard title="Booking funnel"><ResponsiveContainer width="100%" height={280}><BarChart data={data.funnel}><CartesianGrid stroke="#eeeeef" vertical={false} /><XAxis dataKey="status" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="trips" name="Trips" fill="#303030" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Top-performing listings" wide><ResponsiveContainer width="100%" height={300}><BarChart data={data.topListings.slice(0, 10)} layout="vertical" margin={{ left: 12, right: 20 }}><CartesianGrid stroke="#eeeeef" horizontal={false} /><XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} /><YAxis type="category" dataKey="title" width={170} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="revenue" name="Revenue" fill="#303030" radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer></ChartCard>    </div>
  );
}

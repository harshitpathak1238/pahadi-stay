import Link from 'next/link';
import { ArrowUpRight, BarChart3, BookOpen, ExternalLink, Hotel, ListChecks, Package, Bike, Users, WalletCards } from 'lucide-react';

export const metadata = {
  title: 'Admin workspace',
  description: 'The KainchiDarshan operations hub.',
};

const destinations = [
  { href: '/admin/stays', label: 'Stays', description: 'Homes, hotels, and homestays', icon: Hotel, image: 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=85', tone: 'light', wide: true },
  { href: '/admin/rides', label: 'Rides', description: 'Transport and pickup options', icon: Bike, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=85', tone: 'blue' },
  { href: '/admin/rentals', label: 'Rentals', description: 'Scooters, bikes, and more', icon: Bike, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=85', tone: 'yellow' },
  { href: '/admin/activities', label: 'Activities', description: 'Experiences around Kumaon', icon: ListChecks, image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=85', tone: 'peach' },
  { href: '/admin/packages', label: 'Packages', description: 'Bundled travel plans', icon: Package, image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=85', tone: 'green' },
  { href: '/admin/blog', label: 'Blog & content', description: 'Stories, SEO, and publishing', icon: BookOpen, image: 'https://images.unsplash.com/photo-1455390582262-044cdaad277a?auto=format&fit=crop&w=800&q=85', tone: 'pink' },
  { href: '/admin/users', label: 'People & partners', description: 'Hosts, operators, and guests', icon: Users, image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85', tone: 'blue' },
  { href: '/admin/payouts', label: 'Payouts', description: 'Bookings and settlements', icon: WalletCards, image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=85', tone: 'yellow' },
];

export default function AdminLanding() {
  return <div className="min-h-screen bg-[#f2f4ed] px-5 pb-10 pt-28 md:px-8 md:pb-14 md:pt-36">
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173f35] px-6 py-10 text-white shadow-[0_18px_50px_rgba(23,63,53,.14)] md:px-10 md:py-14">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-[#d6a06d]/20" />
        <div className="pointer-events-none absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full border border-[#f7f4ec]/15" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-3 sans text-xs font-bold uppercase tracking-[.2em] text-[#d6a06d]"><span className="h-px w-8 bg-[#d6a06d]" /> KainchiDarshan control room</div>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.05] md:text-6xl">Make every Kumaon stay feel considered.</h1>
          <p className="mt-5 max-w-xl sans text-sm leading-6 text-white/70 md:text-base">Your central place to shape the marketplace, support partners, and keep the guest experience moving in the right direction.</p>
          <div className="mt-8 flex flex-wrap gap-3 sans text-sm font-bold">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#b66b45] px-5 py-3 text-white transition hover:bg-[#c77b52]">Open content studio <ArrowUpRight size={17} /></Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-white transition hover:bg-white/10">View live site <ExternalLink size={16} /></Link>
          </div>
        </div>
        <div className="relative mt-10 grid max-w-3xl grid-cols-2 border-t border-white/15 pt-6 sans sm:grid-cols-4">
          {[['84', 'Bookings'], ['7', 'Draft items'], ['42', 'Partners'], ['₹3.2L', 'This month']].map(([value, label]) => <div className="border-r border-white/15 px-3 first:pl-0 last:border-0" key={label}><p className="text-xl font-bold text-[#f7f4ec] md:text-2xl">{value}</p><p className="mt-1 text-xs text-white/55">{label}</p></div>)}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4"><div><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Your workbench</p><h2 className="mt-2 text-3xl text-[#173f35] md:text-4xl">Where would you like to begin?</h2></div><BarChart3 className="hidden text-[#b66b45] sm:block" size={30} /></div>
        <div className="mt-6 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-4">
          {destinations.map(({ href, label, description, icon: Icon, image, tone, wide }) => <Link href={href} className={`group relative isolate flex overflow-hidden rounded-[1.25rem] p-5 transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(23,63,53,.14)] ${wide ? 'col-span-2 row-span-2' : ''} ${tone === 'light' ? 'bg-[#ececeb] text-[#23332e]' : tone === 'blue' ? 'bg-[#d8eff8] text-[#23332e]' : tone === 'yellow' ? 'bg-[#fff1b8] text-[#23332e]' : tone === 'peach' ? 'bg-[#f7dfd5] text-[#23332e]' : tone === 'green' ? 'bg-[#dceee4] text-[#23332e]' : 'bg-[#f3dce1] text-[#23332e]'}`} key={href}>
            <img src={image} alt="" className={`absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${wide ? 'opacity-75' : 'opacity-80'}`} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
            <div className="flex w-full flex-col justify-between"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/75 text-[#24584a] backdrop-blur-sm"><Icon size={18} /></span><ArrowUpRight className="text-white drop-shadow transition group-hover:-translate-y-1 group-hover:translate-x-1" size={20} /></div><div className="mt-auto"><p className="sans text-[10px] font-bold uppercase tracking-[.16em] text-white/80">KainchiDarshan</p><h3 className={`${wide ? 'text-4xl md:text-5xl' : 'text-2xl'} mt-1 font-semibold text-white drop-shadow`}>{label}</h3><p className="mt-1 sans text-xs font-semibold text-white/85">{description}</p></div></div>
          </Link>)}
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-4 border-t border-[#dfe3d8] py-7 sans text-sm sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-bold text-[#173f35]">A quiet checkpoint</p><p className="mt-1 text-[#6c7770]">All systems healthy. Last inventory sync completed just now.</p></div>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 font-bold text-[#b66b45] hover:text-[#9f5938]">Review live inventory <ArrowUpRight size={16} /></Link>
      </section>
    </div>
  </div>;
}
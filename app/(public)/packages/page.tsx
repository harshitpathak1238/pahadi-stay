import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/public/Breadcrumbs';
import { bhimtalPackage } from './package-data';
import { getPublicPackages } from '@/lib/packages';
import { matchesTextQuery } from '@/lib/search-params';

const packageExcerpt = (html: string) => html.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);

export const metadata = { title: 'Kumaon packages', description: 'Thoughtful stays and experiences bundled around Kumaon.' };

export default async function Packages({ searchParams }: { searchParams: { where?: string } }) {
	const { data: packages, degraded } = await getPublicPackages();
	// The hero "Packages" tab navigates here with ?where=<place>, so honour it
	// like /stays, /rides, /rentals and /activities do.
	const query = (searchParams.where ?? '').trim();
	const filtered = packages.filter((packageItem) =>
		matchesTextQuery([packageItem.title, packageItem.location, packageExcerpt(packageItem.description)].join(' '), query),
	);
	return (
		<div className="min-h-screen pb-20">
			{degraded && (
				<div className="border-b border-[#e4e3da] bg-[#fdf3e7] px-5 py-3 text-center text-sm font-semibold text-[#8a5a00]" role="status">
					Our package catalog is temporarily unavailable — please check back shortly.
				</div>
			)}
			<section className="mx-auto max-w-7xl px-5 pb-12 pt-28 md:pb-16 md:pt-36">
				{/* Breadcrumb: Home › Packages */}
				<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Packages' }]} className="mb-8" />
				<div className="max-w-3xl">
					<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Curated escapes</p>
					<h1 className="mt-4 text-5xl leading-[.98] md:text-7xl">The hills, with the important bits taken care of.</h1>
					<p className="sans mt-6 max-w-xl text-base leading-7 text-[#526057]">Stay longer, see more, and leave the logistics to us. Every Pahadi package pairs a local stay with an easy route through Kumaon.</p>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-2" aria-labelledby="package-heading">
				{query && <p className="sans text-sm text-[#526057] md:col-span-2">Showing {filtered.length} of {packages.length} packages matching <strong>{query}</strong>. <Link href="/packages" className="font-bold underline">Clear search</Link></p>}
				{filtered.map((packageItem) => <Link key={packageItem.id} href={`/packages/${packageItem.id}`} className="group overflow-hidden rounded-[1.75rem] border border-[#e4e3da] bg-white text-[#23332e] shadow-[0_14px_35px_rgba(6,95,70,.08)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c9d6ce] hover:shadow-[0_20px_46px_rgba(6,95,70,.14)]">
					<div className="relative min-h-[260px] overflow-hidden"><Image src={packageItem.image} alt={packageItem.title} fill sizes="(max-width: 768px) 92vw, 45vw" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#102f27]/55 via-transparent to-transparent" /><span className="sans absolute bottom-5 left-5 rounded-full border border-white/40 bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#065f46] backdrop-blur-sm">{packageItem.location}</span></div>
					<div className="p-7"><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Travel package</p><h2 className="mt-3 text-3xl leading-tight text-[#065f46]">{packageItem.title}</h2><p className="sans mt-4 line-clamp-3 text-sm leading-7 text-[#6c7770]">{packageExcerpt(packageItem.description)}</p><div className="mt-7 flex items-end justify-between gap-4 border-t border-[#e4e3da] pt-5"><div><p className="sans text-xs uppercase tracking-[.16em] text-[#8a948c]">Per person price</p><p className="mt-1 text-2xl font-semibold text-[#065f46]">₹{packageItem.price.toLocaleString('en-IN')}</p></div><span className="sans inline-flex items-center gap-1.5 text-sm font-bold text-[#047857] transition group-hover:gap-2.5">View package <span aria-hidden="true">↗</span></span></div></div>
				</Link>)}
				{filtered.length === 0 && <p className="sans rounded-2xl border border-dashed border-[#dfe3d8] p-10 text-center text-[#526057] md:col-span-2">{query ? <>No packages match “{query}”. Try “Bhimtal” or <Link href="/packages" className="font-bold underline">clear the search</Link>.</> : 'Packages will appear here soon.'}</p>}
				{/* Keep the original feature link available for the seeded package experience. */}
				{packages.length === 1 && packages[0].id === bhimtalPackage.slug && <Link href={`/packages/${bhimtalPackage.slug}`} className="hidden">See the full day-by-day plan</Link>}
			</section>
			{/*
			<section className="mx-auto max-w-7xl px-5" aria-labelledby="package-heading">
				<div className="overflow-hidden rounded-[2rem] bg-[#047857] text-white shadow-[0_24px_60px_rgba(6,95,70,.16)] md:grid md:grid-cols-[1.05fr_.95fr]">
					<div className="relative min-h-[360px] overflow-hidden md:min-h-[570px]">
						<img src={bhimtalPackage.image} alt="Mountain lake landscape near Bhimtal" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
						<div className="absolute inset-0 bg-gradient-to-t from-[#102f27]/85 via-[#065f46]/10 to-transparent" />
						<div className="sans absolute bottom-6 left-6 rounded-full border border-white/35 bg-[#065f46]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] backdrop-blur-sm">Ex-Haldwani · 6 guests</div>
					</div>
					<div className="flex flex-col justify-between p-7 md:p-12">
						<div>
							<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#e6b17e]">{bhimtalPackage.eyebrow}</p>
							<h2 id="package-heading" className="mt-4 text-4xl leading-tight md:text-5xl">{bhimtalPackage.shortTitle}</h2>
							<p className="sans mt-5 max-w-md text-sm leading-7 text-white/70">{bhimtalPackage.description}</p>
							<div className="sans mt-8 grid grid-cols-2 gap-x-5 gap-y-6 border-y border-white/15 py-7 text-sm">
								<div><p className="text-white/50">Duration</p><p className="mt-1 font-semibold">{bhimtalPackage.duration}</p></div>
								<div><p className="text-white/50">Meal plan</p><p className="mt-1 font-semibold">{bhimtalPackage.meals} · room only</p></div>
								<div><p className="text-white/50">Sightseeing</p><p className="mt-1 font-semibold">3 full days</p></div>
								<div><p className="text-white/50">Stay</p><p className="mt-1 font-semibold">Homestay</p></div>
							</div>
						</div>
						<div className="mt-10 flex flex-wrap items-end justify-between gap-5">
							<div><p className="sans text-xs uppercase tracking-[.16em] text-white/50">Total package price</p><p className="mt-1 text-3xl">{bhimtalPackage.price}</p><p className="sans mt-1 text-xs text-white/60">{bhimtalPackage.perPerson}</p></div>
							<Button href={`/packages/${bhimtalPackage.slug}`}>View itinerary <span aria-hidden="true" className="ml-2">↗</span></Button>
						</div>
					</div>
				</div>
				<Link href={`/packages/${bhimtalPackage.slug}`} className="sans mt-6 inline-block text-sm font-semibold text-[#047857] underline decoration-[#d6a06d] underline-offset-4">See the full day-by-day plan</Link>
			</section>*/}
		</div>
	);
}

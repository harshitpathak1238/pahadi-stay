import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { bhimtalPackage } from './package-data';

export const metadata = { title: 'Kumaon packages', description: 'Thoughtful stays and experiences bundled around Kumaon.' };

export default function Packages() {
	return (
		<div className="min-h-screen pb-20">
			<section className="mx-auto max-w-7xl px-5 pb-12 pt-28 md:pb-16 md:pt-36">
				<div className="max-w-3xl">
					<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Curated escapes</p>
					<h1 className="mt-4 text-5xl leading-[.98] md:text-7xl">The hills, with the important bits taken care of.</h1>
					<p className="sans mt-6 max-w-xl text-base leading-7 text-[#526057]">Stay longer, see more, and leave the logistics to us. Every Pahadi package pairs a local stay with an easy route through Kumaon.</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-5" aria-labelledby="package-heading">
				<div className="overflow-hidden rounded-[2rem] bg-[#24584a] text-white shadow-[0_24px_60px_rgba(23,63,53,.16)] md:grid md:grid-cols-[1.05fr_.95fr]">
					<div className="relative min-h-[360px] overflow-hidden md:min-h-[570px]">
						<img src={bhimtalPackage.image} alt="Mountain lake landscape near Bhimtal" className="absolute inset-0 h-full w-full object-cover" />
						<div className="absolute inset-0 bg-gradient-to-t from-[#102f27]/85 via-[#173f35]/10 to-transparent" />
						<div className="sans absolute bottom-6 left-6 rounded-full border border-white/35 bg-[#173f35]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] backdrop-blur-sm">Ex-Haldwani · 6 guests</div>
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
				<Link href={`/packages/${bhimtalPackage.slug}`} className="sans mt-6 inline-block text-sm font-semibold text-[#24584a] underline decoration-[#d6a06d] underline-offset-4">See the full day-by-day plan</Link>
			</section>
		</div>
	);
}

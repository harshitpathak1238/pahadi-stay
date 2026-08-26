import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { bhimtalPackage } from '../package-data';

export const metadata = { title: 'Bhimtal holiday package', description: 'A 3 Nights / 4 Days Bhimtal holiday package from Haldwani.' };

export default function PackageDetail({ params }: { params: { slug: string } }) {
	if (params.slug !== bhimtalPackage.slug) notFound();

	return (
		<div className="pb-20">
			<section className="relative flex min-h-[560px] items-end overflow-hidden bg-[#173f35] px-5 pb-12 pt-32 text-white md:min-h-[680px] md:pb-16">
				<img src={bhimtalPackage.image} alt="Misty mountains and a lake in Kumaon" className="absolute inset-0 h-full w-full object-cover opacity-60" />
				<div className="absolute inset-0 bg-gradient-to-t from-[#102f27] via-[#173f35]/45 to-[#173f35]/20" />
				<div className="relative mx-auto w-full max-w-7xl">
					<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#e6b17e]">{bhimtalPackage.eyebrow} · {bhimtalPackage.duration}</p>
					<h1 className="mt-4 max-w-4xl text-5xl leading-[.98] md:text-7xl">{bhimtalPackage.title}</h1>
					<p className="sans mt-6 max-w-2xl text-base leading-7 text-white/75">{bhimtalPackage.description}</p>
				</div>
			</section>

			<div className="mx-auto grid max-w-7xl gap-14 px-5 pt-12 md:grid-cols-[1fr_320px] md:gap-20 md:pt-20">
				<main>
					<section aria-labelledby="summary-heading">
						<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Package proposal</p>
						<h2 id="summary-heading" className="mt-3 text-4xl">Everything for an easy arrival.</h2>
						<div className="sans mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#e4e3da] bg-[#e4e3da] sm:grid-cols-2">
							{[['Group size', bhimtalPackage.guests], ['Pickup & drop', 'Haldwani railway station / bus stand'], ['Meal plan', 'EP plan · room only'], ['Transportation', 'Private cab for transfers & sightseeing']].map(([label, value]) => <div key={label} className="bg-[#fbfaf5] p-5"><p className="text-xs uppercase tracking-[.14em] text-[#7c877d]">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#23332e]">{value}</p></div>)}
						</div>
					</section>

					<section className="mt-16" aria-labelledby="itinerary-heading">
						<p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Day-wise itinerary</p>
						<h2 id="itinerary-heading" className="mt-3 text-4xl">Four days at lake pace.</h2>
						<div className="mt-8 divide-y divide-[#e4e3da] border-y border-[#e4e3da]">{bhimtalPackage.itinerary.map((item) => <article key={item.day} className="grid gap-3 py-7 sm:grid-cols-[100px_1fr]"><p className="sans text-sm font-bold text-[#b66b45]">{item.day}</p><div><h3 className="text-2xl">{item.title}</h3><p className="sans mt-3 text-sm leading-7 text-[#526057]">{item.text}</p></div></article>)}</div>
					</section>

					<section className="mt-16 grid gap-10 sm:grid-cols-2" aria-label="Package inclusions and exclusions">
						<div><h2 className="text-3xl">Included</h2><ul className="sans mt-5 space-y-4 text-sm leading-6 text-[#526057]">{bhimtalPackage.inclusions.map((item) => <li key={item} className="flex gap-3"><span className="text-[#b66b45]">+</span>{item}</li>)}</ul></div>
						<div><h2 className="text-3xl">Not included</h2><ul className="sans mt-5 space-y-4 text-sm leading-6 text-[#526057]">{bhimtalPackage.exclusions.map((item) => <li key={item} className="flex gap-3"><span className="text-[#b66b45]">−</span>{item}</li>)}</ul></div>
					</section>
				</main>

				<aside className="h-fit md:sticky md:top-8">
					<div className="rounded-2xl border border-[#e4e3da] bg-white p-6 shadow-[0_18px_50px_rgba(23,63,53,.08)]">
						<p className="sans text-xs font-bold uppercase tracking-[.16em] text-[#7c877d]">Total package price</p>
						<p className="mt-2 text-4xl text-[#173f35]">{bhimtalPackage.price}</p>
						<p className="sans mt-1 text-sm text-[#526057]">{bhimtalPackage.perPerson}</p>
						<div className="sans my-6 space-y-3 border-y border-[#e4e3da] py-5 text-sm"><p className="flex justify-between"><span className="text-[#7c877d]">Duration</span><span className="font-semibold">{bhimtalPackage.duration}</span></p><p className="flex justify-between"><span className="text-[#7c877d]">Plan</span><span className="font-semibold">EP · room only</span></p></div>
						<Button href="/contact">Enquire about this trip</Button>
						<p className="sans mt-4 text-center text-xs leading-5 text-[#7c877d]">We will confirm stay availability and pickup details with you.</p>
					</div>
				</aside>
			</div>
		</div>
	);
}
import { notFound } from 'next/navigation'; export default function PackageDetail({params}:{params:{slug:string}}){if(!params.slug)notFound();return <div className="mx-auto max-w-4xl px-5 py-20"><p className="sans text-xs uppercase tracking-[.2em] text-[#b66b45]">Curated package</p><h1 className="mt-3 text-5xl">Lake + temple, the Kumaon way</h1><p className="mt-6 text-xl leading-8 text-[#526057]">A gentle three-day introduction to the hills, with the important bits taken care of.</p></div>}

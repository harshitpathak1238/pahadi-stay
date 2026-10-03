import { Button } from '@/components/ui/Button'; import { Breadcrumbs } from '@/components/public/Breadcrumbs'; import { matchesTextQuery } from '@/lib/search-params';
export const metadata={title:'Activities in Kumaon',description:'Small adventures and local experiences around Bhimtal.'};
// The hero search box can target this tab, so the page reads the place query
// instead of silently ignoring it.
export default function Activities({ searchParams }: { searchParams: { where?: string } }) {
  const query = (searchParams.where ?? '').trim();
  // Matches the showcase copy so the hero's suggested places are reflected.
  const showcasesAnything = !query || matchesTextQuery('bhimtal bhowali bhauti kumaon nainital bhilwali talley valley forest walks lake mornings local food experiences', query);
  return <div className="mx-auto max-w-6xl px-5 py-20"><Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Activities' }]} className="mb-8" /><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Make a day of it</p><h1 className="mt-3 text-5xl">Good stories start outside.</h1><p className="sans mt-5 max-w-lg leading-7 text-[#6c7770]">Forest walks, lake mornings, and local food experiences made easy to book.</p><div className="mt-10 rounded-2xl bg-[#d6a06d] p-8"><h2 className="text-2xl text-[#173f35]">Experiences are being curated</h2><p className="sans mt-3 text-[#173f35]/70">We are meeting the people who make Kumaon special.</p>{query && <p className="sans mt-3 text-sm font-semibold text-[#173f35]/80">{showcasesAnything ? `We are curating experiences around ${query} — tell us what you would like to do.` : `We do not have anything around ${query} yet, but we would love to hear what you are looking for.`}</p>}<Button href={`/contact${query ? `?place=${encodeURIComponent(query)}` : ''}`} variant="quiet">Help us choose →</Button></div></div>;
}

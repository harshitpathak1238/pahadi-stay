import { notFound } from 'next/navigation';
import { BlogManager } from '@/components/admin/BlogManager';
import { ContentManager } from '@/components/admin/ContentManager';

const sections = { stays: { title: 'Stays', description: 'Manage homes, hotels, and homestays.', type: 'STAY' }, rides: { title: 'Rides', description: 'Manage transport options and pickup details.', type: 'RIDE' }, rentals: { title: 'Rentals', description: 'Manage scooters, bikes, and rental inventory.', type: 'RENTAL' }, activities: { title: 'Activities', description: 'Manage experiences and things to do around Kumaon.', type: 'ACTIVITY' }, packages: { title: 'Packages', description: 'Bundle existing inventory into complete travel plans.', type: 'PACKAGE' }, blog: { title: 'Blog and content', description: 'Create, optimize, and publish destination stories.', type: 'BLOG' } } as const;

export function generateStaticParams() { return Object.keys(sections).map((section) => ({ section })); }

export default function AdminSection({ params }: { params: { section: string } }) {
  const section = sections[params.section as keyof typeof sections];
  if (!section) notFound();
  return <div className="min-h-screen bg-[#f2f4ed] px-5 py-20 md:px-8"><div className="mx-auto max-w-7xl"><p className="sans text-xs font-bold uppercase tracking-[.2em] text-[#b66b45]">Admin section</p><h1 className="mt-3 text-4xl text-[#173f35] md:text-5xl">{section.title}</h1><p className="mt-3 max-w-2xl sans text-sm leading-6 text-[#6c7770]">{section.description}</p><div className="mt-8">{section.type === 'BLOG' ? <BlogManager /> : <ContentManager initialSection={section.type} />}</div></div></div>;
}
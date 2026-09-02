import { notFound } from 'next/navigation';
import { AdminOperationsWorkspace } from '@/components/admin/AdminOperationsWorkspace';

const sections = { stays: { title: 'Stays', description: 'Manage homes, hotels, and homestays.', type: 'STAY' }, rides: { title: 'Rides', description: 'Manage transport options and pickup details.', type: 'RIDE' }, rentals: { title: 'Rentals', description: 'Manage scooters, bikes, and rental inventory.', type: 'RENTAL' }, activities: { title: 'Activities', description: 'Manage experiences and things to do around Kumaon.', type: 'ACTIVITY' }, packages: { title: 'Packages', description: 'Bundle existing inventory into complete travel plans.', type: 'PACKAGE' }, blog: { title: 'Blog and content', description: 'Create, optimize, and publish destination stories.', type: 'BLOG' }, media: { title: 'Media Library', description: 'Centralize images and videos for the whole site.', type: 'MEDIA' } } as const;

export function generateStaticParams() { return Object.keys(sections).map((section) => ({ section })); }

export default function AdminSection({ params }: { params: { section: string } }) {
  const section = sections[params.section as keyof typeof sections];
  if (!section) notFound();
  return <AdminOperationsWorkspace initialView={params.section === 'blog' ? 'Blog' : params.section === 'media' ? 'Media' : 'Listings'} initialSection={section.type === 'PACKAGE' ? 'PACKAGE' : section.type === 'STAY' || section.type === 'RIDE' || section.type === 'RENTAL' || section.type === 'ACTIVITY' ? section.type : 'STAY'} />;
}
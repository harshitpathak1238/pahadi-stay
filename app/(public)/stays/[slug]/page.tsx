import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicListing, getPublicListings } from '@/lib/listings';
import { StayDetailExperience } from '@/components/public/StayDetailExperience';

export async function generateStaticParams() {
  const { data } = await getPublicListings('STAY');
  return data.map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: stay } = await getPublicListing(params.slug);
  return { title: stay?.title ?? 'Stay', description: stay?.description.replace(/<[^>]+>/g, '').slice(0, 160) };
}

export default async function StayDetail({ params }: { params: { slug: string } }) {
  const { data: stay } = await getPublicListing(params.slug);
  if (!stay) notFound();
  return <StayDetailExperience stay={stay} />;
}

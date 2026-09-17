import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicListing, getPublicListings } from '@/lib/listings';
import { getStayReviewData } from '@/lib/reviews';
import { getPublicRides } from '@/lib/rides';
import { pickupRoutes } from '@/lib/pickup-pricing';
import { StayDetailExperience } from '@/components/public/StayDetailExperience';

export async function generateStaticParams() {
  const { data } = await getPublicListings('STAY');
  return data.map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: stay } = await getPublicListing(decodeURIComponent(params.slug));
  return { title: stay?.title ?? 'Stay', description: stay?.description?.replace(/<[^>]+>/g, '').slice(0, 160) };
}

export default async function StayDetail({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const { data: stay } = await getPublicListing(slug);
  if (!stay) notFound();
  const [reviewData, rides] = await Promise.all([getStayReviewData(slug), getPublicRides()]);
  return <StayDetailExperience stay={stay} reviewData={reviewData} pickupRoutes={pickupRoutes(rides.data)} pickupUnavailable={rides.degraded} />;
}

import type { Listing } from '@/lib/mock-data';
import { ListingCard } from './ListingCard';

export function DealCarousel({ listings }: { listings: Listing[] }) {
  return <div className="deal-carousel -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">{listings.map((listing) => <div className="min-w-[82vw] snap-start sm:min-w-[350px] md:min-w-0" key={listing.slug}><ListingCard listing={listing}/></div>)}</div>;
}

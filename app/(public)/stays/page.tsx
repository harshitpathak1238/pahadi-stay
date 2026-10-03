import type { Metadata } from 'next';
import { getPublicListings } from '@/lib/listings';
import { StaysSearchPage } from '@/components/public/StaysSearchPage';
import { normaliseGuests, STAY_FILTERS } from '@/lib/search-params';

export const metadata: Metadata = { title: 'Stays around Bhimtal', description: 'Compare handpicked stays, prices, amenities, and availability around Bhimtal and Kainchi Dham.' };

type StaysSearchParams = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  amenities?: string;
};

/**
 * Amenity labels arrive comma-separated. Anything not in the shared filter
 * list is dropped so a hand-edited URL cannot push unknown filters into the
 * query state.
 */
function parseAmenities(value?: string): string[] {
  if (!value) return [];
  const known = new Set(STAY_FILTERS.map((filter) => filter.label));
  return value.split(',').map((item) => item.trim()).filter((item) => known.has(item));
}

export default async function Stays({ searchParams }: { searchParams: StaysSearchParams }) {
	const { data: stays, degraded } = await getPublicListings('STAY');
	const parsedMinPrice = Number(searchParams.minPrice);
	const parsedMaxPrice = Number(searchParams.maxPrice);
	const parsedRating = Number(searchParams.minRating);
	return (
		<>
			{degraded && (
				<div className="border-b border-[#e4e3da] bg-[#fdf3e7] px-5 py-3 text-center text-sm font-semibold text-[#8a5a00]" role="status">
					Our stay catalog is temporarily unavailable — please check back shortly.
				</div>
			)}
			<StaysSearchPage
				stays={stays}
				initialLocation={searchParams.location ?? ''}
				initialCheckIn={searchParams.checkIn ?? ''}
				initialCheckOut={searchParams.checkOut ?? ''}
				initialGuests={normaliseGuests(searchParams.guests)}
				initialMinPrice={Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined}
				initialMaxPrice={Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined}
				initialMinRating={Number.isFinite(parsedRating) ? parsedRating : undefined}
				initialAmenities={parseAmenities(searchParams.amenities)}
			/>
		</>
	);
}

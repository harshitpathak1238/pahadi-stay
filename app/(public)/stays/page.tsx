import type { Metadata } from 'next';
import { getPublicListings } from '@/lib/listings';
import { StaysSearchPage } from '@/components/public/StaysSearchPage';

export const metadata: Metadata = { title: 'Stays around Bhimtal', description: 'Compare handpicked stays, prices, amenities, and availability around Bhimtal and Kainchi Dham.' };

type StaysSearchParams = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
};

export default async function Stays({ searchParams }: { searchParams: StaysSearchParams }) {
	const { data: stays, degraded } = await getPublicListings('STAY');
	const parsedGuests = Number(searchParams.guests);
	const parsedMinPrice = Number(searchParams.minPrice);
	const parsedMaxPrice = Number(searchParams.maxPrice);
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
				initialGuests={Number.isInteger(parsedGuests) && parsedGuests >= 1 && parsedGuests <= 20 ? parsedGuests : 2}
				initialMinPrice={Number.isFinite(parsedMinPrice) ? parsedMinPrice : undefined}
				initialMaxPrice={Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : undefined}
			/>
		</>
	);
}

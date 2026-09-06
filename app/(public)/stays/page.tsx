import type { Metadata } from 'next';
import { getPublicListings } from '@/lib/listings';
import { StaysSearchPage } from '@/components/public/StaysSearchPage';

export const metadata: Metadata = { title: 'Stays around Bhimtal', description: 'Compare handpicked stays, prices, amenities, and availability around Bhimtal and Kainchi Dham.' };

export default async function Stays() {
	const stays = await getPublicListings('STAY');
	return <StaysSearchPage stays={stays} />;
}

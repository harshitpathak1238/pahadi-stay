import { WishlistWorkspace } from '@/components/account/WishlistWorkspace';

export const metadata = { title: 'Your wishlist', description: 'Stays you saved for future trips to the hills.' };

export default function Wishlist() {
	return <WishlistWorkspace />;
}
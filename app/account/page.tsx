import { Heart } from 'lucide-react';
import Link from 'next/link';
import { AccountWorkspace } from '@/components/account/AccountWorkspace';

export const metadata = { title: 'Your account', description: 'Manage your KainchiDarshan profile and bookings.' };

export default function Account() {
	return (
		<>
			<div className="mx-auto max-w-6xl px-5 pt-10 md:pt-14">
				<Link href="/account/wishlist" className="sans inline-flex items-center gap-2 rounded-full border border-[#dfe3d8] bg-white px-4 py-2 text-sm font-semibold text-[#173f35] transition hover:bg-[#f4f6f1]">
					<Heart size={15} className="text-rose-600" />
					My wishlist
				</Link>
			</div>
			<AccountWorkspace />
		</>
	);
}

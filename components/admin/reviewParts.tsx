'use client';
import { MessageSquareHeart, RefreshCw, Search, Plus } from 'lucide-react';
export { MessageSquareHeart, RefreshCw, Search, Plus };
export type ReviewRow = { id: string; listingId: string; guestName: string; guestEmail: string | null; overallRating: number; staff: number | null; facilities: number | null; cleanliness: number | null; comfort: number | null; valueForMoney: number | null; location: number | null; comment: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; isVerified: boolean; bookingId: string | null; createdAt: string; listing?: { id: string; title: string; slug: string } | null; };
export type StayOption = { id: string; title: string; slug: string };
export type FormState = { listingId: string; guestName: string; guestEmail: string; comment: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; isVerified: boolean; staff: string; facilities: string; cleanliness: string; comfort: string; valueForMoney: string; location: string; };
export const emptyForm = (listingId = ''): FormState => ({ listingId, guestName: '', guestEmail: '', comment: '', status: 'APPROVED', isVerified: false, staff: '', facilities: '', cleanliness: '', comfort: '', valueForMoney: '', location: '' });
export const badge: Record<string, string> = { PENDING: 'bg-[#fdf3e7] text-[#8a5a00]', APPROVED: 'bg-[#e8f5ee] text-[#16704a]', REJECTED: 'bg-[#fdecec] text-[#b42318]' };

import { NextResponse } from 'next/server';
import { getPublicListings } from '@/lib/listings';

export async function GET() { return NextResponse.json(await getPublicListings('STAY')); }

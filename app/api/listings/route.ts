import { NextResponse } from 'next/server'; import { stays } from '@/lib/mock-data'; export async function GET(){return NextResponse.json(stays)}

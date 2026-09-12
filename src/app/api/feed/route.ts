import { NextResponse } from 'next/server';
import { getCards } from '@/lib/feed';

export async function GET() {
  return NextResponse.json(getCards());
}

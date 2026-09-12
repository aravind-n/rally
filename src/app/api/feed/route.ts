import { NextRequest, NextResponse } from 'next/server';
import { getCards, updateCard } from '@/lib/feed';

export async function GET() {
  return NextResponse.json(getCards());
}

export async function PATCH(req: NextRequest) {
  const { id, ...patch } = (await req.json()) as { id: string } & Record<string, unknown>;
  updateCard(id, patch);
  return NextResponse.json({ ok: true });
}

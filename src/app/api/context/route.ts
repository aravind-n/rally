import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    attendees: ['Alex', 'Priya', 'Sam'],
    agenda: 'P0 — Payments API Down',
  });
}

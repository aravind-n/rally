import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    attendees: ['Priya', 'Sam', 'Alex', 'Hemanth'],
    agenda: 'Upload Reliability Review',
  });
}

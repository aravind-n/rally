import { NextRequest, NextResponse } from 'next/server';
import type { ToolName } from '@/lib/contract';
import { handlers } from '@/lib/tools';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const handler = (handlers as Record<string, (a: unknown) => Promise<unknown>>)[name];

  if (!handler) {
    return NextResponse.json({ error: `Unknown tool: ${name}` }, { status: 404 });
  }

  const args = await req.json();

  try {
    const result = await handler(args);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        speak: "Something went wrong on my end.",
        error: message,
        card: {
          id: crypto.randomUUID(),
          tool: name as ToolName,
          app: 'Tasks',
          title: 'Error',
          subtitle: message,
          status: 'failed',
          at: Date.now(),
        },
      },
      { status: 500 },
    );
  }
}

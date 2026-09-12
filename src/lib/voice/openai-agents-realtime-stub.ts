// Stub for @openai/agents/realtime — used when the real package isn't installed
// (Apple npm registry lacks @openai/agents-realtime).
// On Aravind's machine the real package is present and this file is never loaded.
// Types are shaped to match exactly what session.ts and tools.ts use.

import type { z } from 'zod';

export type TransportEvent = {
  type: string;
  transcript: string;
  item_id: string;
  error?: unknown;
  [key: string]: unknown;
};

export class OpenAIRealtimeWebRTC {
  requestResponse?: () => void;
  sendEvent(_event: unknown): void {}
  constructor(_opts?: unknown) {}
}

export class RealtimeAgent {
  constructor(_opts?: unknown) {}
}

export class RealtimeSession {
  transport: OpenAIRealtimeWebRTC = new OpenAIRealtimeWebRTC();
  constructor(_agent?: unknown, _opts?: unknown) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(_event: string, _handler: (...args: any[]) => void): void {}
  async connect(_opts?: unknown): Promise<void> {
    throw new Error('Voice unavailable: @openai/agents-realtime not installed. Use ?sim=1 instead.');
  }
  close(): void {}
  interrupt(): void {}
}

export function tool<P extends z.ZodType>(opts: {
  name: string;
  description: string;
  parameters: P;
  execute: (args: z.infer<P>) => Promise<string> | string;
}): unknown {
  return opts;
}

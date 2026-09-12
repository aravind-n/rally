// ============================================================================
// RALLY — FROZEN CONTRACT
// ----------------------------------------------------------------------------
// This is the ONLY interface between Aravind's work (voice / OpenAI Realtime)
// and Hemanth's work (tool belt / Ambiguous / UI).
//
// H0 copies this to rally/src/lib/contract.ts. BOTH agents import from it.
//
// RULE: Do not change this file without writing an entry in inter-agent-comms.md
//       under "## CONTRACT CHANGES" and waiting for the other agent to ACK.
//       Additive changes (new optional field, new tool) = just announce, no ACK.
// ============================================================================

export type RallyState = 'offline' | 'listening' | 'armed' | 'working' | 'speaking';

export const WAKE_WORDS = ['rally', 'rallye', 'raleigh', 'rallies', 'valley', 'really'];
//                                    ^ Whisper mishears "Rally" as these. Accept them all.
//                                      Demo reliability >>> precision. Cut this corner.

export function isWake(text: string): boolean {
  const t = text.toLowerCase();
  return WAKE_WORDS.some((w) => t.includes(w));
}

// ============================================================================
// 1. THE TOOL BELT   —  Aravind declares these to the model.
//                       Hemanth implements them at POST /api/tools/[name].
// ============================================================================

export type ToolName =
  | 'file_task'
  | 'send_mail'
  | 'book_slot'
  | 'write_recap'
  | 'remember'
  | 'recall'
  | 'delegate';   // hand a long task to the SLOW BRAIN (Hermes). Returns instantly, finishes later.

export interface ToolArgs {
  file_task: {
    title: string;
    details?: string;
    assignee?: string;                                  // first name is fine, Hemanth fuzzy-matches
    priority?: 'urgent' | 'high' | 'normal' | 'low';
  };
  send_mail: {
    to: string[];                                       // names OR emails, Hemanth resolves
    subject: string;
    body: string;
  };
  book_slot: {
    title: string;
    with: string[];
    when: string;                                       // NATURAL LANGUAGE. "tomorrow at 3", "next Tuesday morning".
    duration_minutes?: number;                          // Hemanth parses it. Aravind never does date math.
  };
  write_recap: {
    title: string;
    bullets: string[];
    decisions?: string[];
    owners?: { who: string; what: string }[];
  };
  remember: { fact: string; tags?: string[] };
  recall:   { query: string };
  delegate: {
    task: string;              // "find out if Safari 17 has a known fetch bug and report back"
    report_to?: string;        // Ambiguous Chat channel or person. default: the meeting channel.
  };
}

// ---------------------------------------------------------------------------
// THE KEY IDEA: `speak` is written by HEMANTH'S endpoint and spoken by Rally.
// This means Hemanth controls what the voice says about his tools without ever
// touching an OpenAI API, and Aravind never needs to know what Ambiguous is.
// ---------------------------------------------------------------------------
export interface ToolResult {
  ok: boolean;
  speak: string;            // <= 15 words. Rally says this out loud, near-verbatim.
  card: ActionCard;         // renders in the action feed on the room display
  error?: string;
}

export interface ActionCard {
  id: string;
  tool: ToolName;
  app: 'Tasks' | 'Mail' | 'Calendar' | 'Docs' | 'Chat' | 'Memory' | 'Brain';  // which Ambiguous app / Hermes
  title: string;
  subtitle?: string;
  meta?: string[];          // chips rendered under the title: ["Priya", "P1", "tomorrow 3pm"]
  url?: string;             // deep link into the Ambiguous workspace
  status: 'pending' | 'done' | 'failed';
  at: number;
}

export const TOOL_ENDPOINT = (name: ToolName) => `/api/tools/${name}`;

/**
 * Async updates (Hermes finishing a delegated task, Ambiguous confirming a write)
 * land here. The room display POLLS this every 2s and merges by card.id.
 * No SSE, no websockets, no subscriptions. This is the corner we are cutting.
 */
export const FEED_ENDPOINT = '/api/feed';   // -> ActionCard[]

/** Aravind's dispatcher calls this. Never throws — a failed tool still speaks. */
export async function callTool<T extends ToolName>(
  name: T,
  args: ToolArgs[T],
): Promise<ToolResult> {
  try {
    const r = await fetch(TOOL_ENDPOINT(name), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    return (await r.json()) as ToolResult;
  } catch (e) {
    return {
      ok: false,
      speak: "I couldn't reach the workspace.",
      error: String(e),
      card: {
        id: crypto.randomUUID(), tool: name, app: 'Tasks',
        title: 'Failed', status: 'failed', at: Date.now(),
      },
    };
  }
}

// ============================================================================
// 2. THE EVENT BUS   —  Aravind emits. Hemanth renders. Nobody else touches it.
// ============================================================================

export type RallyEvent =
  | { t: 'state';      state: RallyState }
  | { t: 'heard';      id: string; speaker?: string; text: string; final: boolean; at: number }
  | { t: 'wake';       utterance: string; at: number }
  | { t: 'thinking';   label: string }
  | { t: 'tool_start'; id: string; tool: ToolName; args: unknown; at: number }
  | { t: 'tool_done';  id: string; tool: ToolName; result: ToolResult; at: number }
  | { t: 'spoke';      text: string; at: number }
  | { t: 'context';    attendees: string[]; agenda?: string }
  | { t: 'error';      message: string };

type Handler = (e: RallyEvent) => void;

/**
 * Works in one tab, and ALSO across two tabs via BroadcastChannel —
 * so the room display can live on the TV while the mic runs on the laptop.
 */
class Bus {
  private handlers = new Set<Handler>();
  private bc: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.bc = new BroadcastChannel('rally');
      this.bc.onmessage = (m) => this.handlers.forEach((h) => h(m.data as RallyEvent));
    }
  }
  emit(e: RallyEvent) {
    this.handlers.forEach((h) => h(e));
    this.bc?.postMessage(e);
  }
  on(h: Handler) {
    this.handlers.add(h);
    return () => this.handlers.delete(h);
  }
}

export const bus = new Bus();

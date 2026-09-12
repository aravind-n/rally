# AGENT-ARAVIND.md — the fast brain

**You own every line of OpenAI code in this repo.** Nobody else touches it.
Read `PLAN.md` for the product, `contract.ts` for the interface, `inter-agent-comms.md` before
every task. Post `SHIPPED` in comms when you finish A4 and A3 — those are the ones Hemanth waits on.

**Your files.** Touch nothing else without a `FYI` in comms:
```
src/app/api/rally/token/route.ts
src/lib/voice/*
src/components/VoiceController.tsx
.env.local                  (OPENAI_API_KEY lives here and ONLY here)
```

`src/lib/contract.ts` is already in the repo. `npm i @openai/agents zod` once Hemanth's H0
scaffold lands (~12:30); until then work in a scratch file.

---

## A0 · Ephemeral token route — 15 min

`POST /api/rally/token` → mints a short-lived client secret so the browser never sees your key.

```ts
// src/app/api/rally/token/route.ts
export async function POST() {
  const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      session: { type: 'realtime', model: 'gpt-realtime-2.1' },
    }),
  });
  return Response.json(await r.json());   // { value: "ek_...", expires_at }
}
```

**Done when:** `curl -XPOST localhost:3000/api/rally/token` returns an `ek_...`.
**If the payload shape has drifted**, the current docs are at
<https://developers.openai.com/api/docs/guides/realtime>. Fix it here and move on — this route
is 10 lines and it is not where your day goes.

---

## A1 · Voice loop, hello world — 30 min

Get speech in and speech out, no gating, no tools. Prove the pipe.

```ts
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({ name: 'Rally', instructions: 'You are Rally.' });
const session = new RealtimeSession(agent, { model: 'gpt-realtime-2.1' });
const { value } = await (await fetch('/api/rally/token', { method: 'POST' })).json();
await session.connect({ apiKey: value });
```

The SDK handles WebRTC, mic capture and playback. **Do not hand-roll `RTCPeerConnection`
unless A2 forces you to** (see below).

**Feedback loop, fix it now not at 17:50:** `getUserMedia({ audio: { echoCancellation: true,
noiseSuppression: true, autoGainControl: true } })`, and wear headphones during dev. Rally
hearing itself is the most common way this demo dies.

**Done when:** you say "hello" and it answers out loud.

---

## A2 · THE WAKE-WORD GATE — 60 min, timeboxed hard ⭐

**This is the most important task in the repo.** It is also the demo's best beat: Rally listens
for a full minute and says nothing. Do not try to achieve this by asking the model nicely in the
system prompt — it will butt in, and it will butt in on camera. **Gate it in code.**

### Path A (preferred): transcribe always, respond never, fire manually

Configure the session so VAD segments turns and transcribes them, but **the model never
auto-responds**:

```ts
{
  audio: {
    input: {
      transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        create_response: false,      // ← the whole trick
        interrupt_response: false,
      },
    },
  },
}
```

Then listen for completed user transcripts and decide yourself:

```ts
import { isWake, bus } from '@/lib/contract';

session.transport.on('*', (ev: any) => {
  if (ev.type === 'conversation.item.input_audio_transcription.completed') {
    const text = ev.transcript as string;
    bus.emit({ t: 'heard', id: ev.item_id, text, final: true, at: Date.now() });

    if (isWake(text)) {
      bus.emit({ t: 'wake', utterance: text, at: Date.now() });
      bus.emit({ t: 'state', state: 'working' });
      session.transport.sendEvent({ type: 'response.create' });   // ← only here does Rally speak
    }
  }
});
```

Deterministic. Auditable. Demoable. If `create_response: false` isn't honoured by the model
version you get, immediately `response.cancel` any response whose triggering utterance failed
`isWake()` — same effect, one frame of latency.

### Path B (fallback, if Path A isn't working by T+2h): push-to-talk

`turn_detection: null`, hold **spacebar** to talk, on keyup:
```ts
session.transport.sendEvent({ type: 'input_audio_buffer.commit' });
session.transport.sendEvent({ type: 'response.create' });
```
Less magical but bulletproof. **Set a timer. At T+2h, if Path A is flaky, take Path B and never
look back.** You can still demo silence — just don't hold the key.

### Path C (only if both fail): browser `SpeechRecognition` for the always-on transcript, and
open the Realtime session only after the wake word. Two audio paths, more moving parts, but it
guarantees the silent-listening visual.

**Done when:** you hold a 60-second conversation with another human and Rally does not make a
sound, then says "Rally" and it responds within a second.
**Post `SHIPPED` in comms with which path you took** — Hemanth's orb states depend on it.

---

## A3 · Tool dispatcher — 30 min

Declare the 7 tools from `contract.ts` to the model. Every `execute` does the same thing: POST
to Hemanth's endpoint, emit bus events, return `speak` to the model.

```ts
import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import { callTool, bus, type ToolName } from '@/lib/contract';

const make = (name: ToolName, description: string, parameters: z.ZodTypeAny) =>
  tool({
    name, description, parameters,
    execute: async (args: any) => {
      const id = crypto.randomUUID();
      bus.emit({ t: 'tool_start', id, tool: name, args, at: Date.now() });
      const res = await callTool(name, args);
      bus.emit({ t: 'tool_done', id, tool: name, result: res, at: Date.now() });
      return res.speak;                 // ← Hemanth wrote this sentence. Say it.
    },
  });
```

**You never parse a date, resolve a name, or format an email.** `book_slot.when` is natural
language and Hemanth parses it. `send_mail.to` is first names and Hemanth resolves them. Keep
your schemas loose — a loose schema that always fires beats a strict one that argues.

**Done when:** "Rally, file a bug about the login page" produces a card on Hemanth's screen.

---

## A4 · Bus wiring + `?sim=1` — 30 min ⭐ (do this EARLY, Hemanth is blocked on it)

Emit the full `RallyEvent` stream from the session: `state` transitions on every mode change,
`heard` on transcripts, `spoke` when Rally finishes talking, `error` on anything thrown.

Then build **`?sim=1`**: a mode that replays a hardcoded meeting through `bus.emit()` on
timers — no microphone, no API key, no network. Ten lines, an array of events, `setTimeout`.

```ts
// src/lib/voice/sim.ts — the most valuable 10 lines you'll write today
const SCRIPT: [number, RallyEvent][] = [
  [0,    { t:'state', state:'listening' }],
  [1200, { t:'heard', id:'1', text:"the signup flow 500s on Safari", final:true, at:0 }],
  [3000, { t:'heard', id:'2', text:"Rally, file that", final:true, at:0 }],
  [3200, { t:'wake',  utterance:'Rally, file that', at:0 }],
  // ...through a full run of the demo script in PLAN.md §2
];
```

**Why it matters:** Hemanth builds the entire UI against this, all day, without a key and
without you. It is also your **live demo fallback** if the network dies in the room.

**Done when:** `npm run dev` with no `OPENAI_API_KEY` set, open `/?sim=1`, and the whole demo
plays out on screen. **Post `SHIPPED` the moment this works.**

---

## A5 · Persona and confirm-out-loud — 30 min

The system prompt. Short, blunt, and mostly about restraint:

```
You are Rally, a participant in a live meeting. You are not a chatbot.

SPEAK LIKE A COLLEAGUE: one sentence, under 15 words, no preamble, no "sure thing!",
no restating the request. Never say "as an AI".

CONFIRM BEFORE AND AFTER: when you fire a tool, say what you're doing in six words or
less first, then say the tool's result verbatim when it returns.

WHEN A TOOL RETURNS TEXT, SAY EXACTLY THAT TEXT. Do not paraphrase it, do not add to it.

ASK ONLY WHEN BLOCKED: if a task is missing an assignee or a time, ask one short question.
Otherwise pick a sensible default and go. The meeting is still happening. Do not stall it.

MULTI-ACTION: "file that and email Sam" means fire both tools. Do not ask which one first.
```

Voice: pick one and stick to it — `cedar` or `marin` read as a colleague; avoid anything
bubbly. Test at room volume through the actual speaker you'll demo on.

---

## A6 · Context priming — 20 min

Before connecting, `GET /api/context` (Hemanth's) for `{ attendees, agenda, recent_decisions }`
and inject it into the session instructions. This is what makes "assign it to Priya" work
without spelling the name, and makes recall answers feel like memory rather than search.

Emit `{ t:'context', attendees, agenda }` on the bus so Hemanth can render the roster.

---

## A7 · Safety net — 20 min, do it before 17:45

1. **Keyboard overrides** on the room display, for when the room is loud: `W` force-wake,
   `S` force-silence, `1`–`7` fire each tool with canned args. Nobody watching the video knows.
2. **`?sim=1` is the rehearsal mode.** Run the whole script from it at least once so you know it
   works when the venue wifi doesn't.
3. **Record a clean screen capture of a successful full run by 17:00.** If the live demo dies
   you still have a video. This has saved more hackathon teams than any amount of error handling.

---

## A8 · The OpenAI config surfaces — 30 min ⭐ start the Hermes half early, H3 is blocked on it

Everything in this project runs on OpenAI models. Two of those live outside your voice code, and
both belong to you so that Hemanth never configures a model or holds a credential.

**1. Hermes's backing model** *(do this in sprint 1, not sprint 3 — H3 waits on it)*
Install [Hermes Agent](https://hermes-agent.nousresearch.com/), sign it in against the team
OpenAI account, point it at the current flagship text model, and leave it **running**. Hand
Hemanth two things in `inter-agent-comms.md`: how to reach it locally (HTTP endpoint or CLI
invocation) and confirmation that it's authenticated. He integrates against a live process and
never touches its config.

**2. `src/app/api/copilotkit/route.ts`** — the CopilotKit runtime, on the OpenAI adapter.
CopilotKit already splits server runtime from client hooks, so this is a clean seam: you own
this one file, Hemanth owns `useCopilotReadable` / `useCopilotAction` / the sidebar.

```ts
// src/app/api/copilotkit/route.ts  — Aravind only
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import OpenAI from 'openai';

const serviceAdapter = new OpenAIAdapter({ openai: new OpenAI() });
export const POST = async (req: Request) =>
  copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(), serviceAdapter, endpoint: '/api/copilotkit',
  }).handleRequest(req);
```

**On auth.** Use account sign-in where the tool actually offers it — Hermes and any desktop/CLI
tooling will take your ChatGPT account directly. The two server routes here (`/api/rally/token`
and `/api/copilotkit`) are plain server-to-server API calls and want a key: mint one from the
same account and put it in `.env.local`. **Don't burn hackathon time trying to OAuth a Next.js
route handler** — same account, same billing, one file, five minutes.

## Checklist

- [ ] A0 token route returns `ek_...`
- [ ] A1 speech in, speech out
- [ ] **A2 silent for 60s, wakes on "Rally", path documented in comms**
- [ ] **A4 `?sim=1` plays the full demo with no API key — `SHIPPED` posted**
- [ ] A3 all 7 tools declared and dispatching
- [ ] A5 persona reads like a colleague at room volume
- [ ] A6 attendees primed
- [ ] **A8 Hermes installed, authed, running — posted in comms (H3 is blocked on this)**
- [ ] A8 `/api/copilotkit` route live on the OpenAI adapter
- [ ] A7 keyboard overrides + backup recording

# AGENT-HEMANTH.md — the hands, the slow brain, the screen

**You own everything that is not OpenAI.** That is most of the product: the workspace
integration, the persistent brain, the copilot, and the entire screen the judges look at.

> ### 🚫 HARD RULE
> **You never install an OpenAI SDK, call an OpenAI endpoint, set an OpenAI key, or type an
> OpenAI model name** — not even in a config file. The app must boot and the UI must fully work
> with no credentials present. If a task seems to need one, **stop and post `BLOCKED` in
> `inter-agent-comms.md`** — that work is Aravind's.
>
> Everything in this project runs on OpenAI models, so the two spots where that could bite you
> are already carved out as Aravind's **A8**: he hands you a **running, already-authenticated
> Hermes process** (H3) and a **working `/api/copilotkit` runtime route** (H5). You integrate
> against both and configure neither.

Read `PLAN.md` for the product, `contract.ts` for the interface, `inter-agent-comms.md` before
every task.

**Your files** — everything except `src/app/api/rally/`, `src/lib/voice/`, `src/components/VoiceController.tsx`.

---

## H0 · Scaffold + mocks — 45 min ⭐ DO THIS FIRST, ARAVIND IS BLOCKED ON IT

The repo already exists and already has `src/lib/contract.ts` in it. Scaffold Next.js
**around** it — `create-next-app` refuses to run in a non-empty directory, so build it
elsewhere and merge it in:

```bash
npx create-next-app@latest /tmp/scaffold --ts --tailwind --app --src-dir --no-eslint --use-npm --yes
rsync -a /tmp/scaffold/ . --exclude .git --exclude README.md
npm i zod chrono-node
npm run dev
```

`rsync` merges rather than replaces, so `src/lib/contract.ts` and the plan docs survive.

Then ship **all 7 tool endpoints returning fake but correctly-shaped `ToolResult`s.** No
Ambiguous yet. No real logic. Just shape.

```ts
// src/app/api/tools/[name]/route.ts
import { NextRequest } from 'next/server';
import type { ToolName, ToolResult } from '@/lib/contract';
import { handlers } from '@/lib/tools';

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: ToolName }> }) {
  const { name } = await params;
  const args = await req.json();
  const result: ToolResult = await handlers[name](args);
  feed.push(result.card);                       // in-memory array is fine
  return Response.json(result);
}
```

```ts
// src/lib/tools.ts — mock version, 30 lines total
file_task: async (a) => ({
  ok: true,
  speak: `Filed "${a.title}"${a.assignee ? `, assigned to ${a.assignee}` : ''}.`,
  card: { id: crypto.randomUUID(), tool:'file_task', app:'Tasks', title:a.title,
          subtitle:a.details, meta:[a.assignee, a.priority].filter(Boolean),
          status:'done', at:Date.now() },
}),
```

Plus `GET /api/feed` → the card array, and `GET /api/context` →
`{ attendees:['Priya','Sam','Aravind','Hemanth'], agenda:'Launch readiness' }`.

**`AMBIGUOUS_MODE=mock|live`** — keep these mocks in the codebase forever behind that flag.
At 17:00, if live Ambiguous misbehaves, you flip one env var and the demo is *identical on
camera*. This is the single best insurance policy in the plan.

**Done when:** `curl -XPOST localhost:3000/api/tools/file_task -d '{"title":"test"}'` returns a
well-formed `ToolResult`. **Post `SHIPPED` immediately** — Aravind can now build A3.

---

## H1 · The room display — 2 hrs ⭐ this IS the demo

One page, `/`, designed to be projected on a TV and filmed. Dark, high contrast, big type,
readable from across a room. Subscribe once: `bus.on(e => …)`, `switch` on `e.t`, done.

```
┌──────────────────────────────────────────┬─────────────────────────┐
│                                          │  ACTION FEED            │
│            ◉                             │  ┌───────────────────┐  │
│         RALLY                            │  │ ✓ Tasks           │  │
│        listening                         │  │ Signup flow 500s… │  │
│                                          │  │ Priya · P1        │  │
│  ─────────── TRANSCRIPT ───────────      │  └───────────────────┘  │
│  · the signup flow 500s on Safari        │  ┌───────────────────┐  │
│  · yeah I saw that this morning          │  │ ✓ Calendar        │  │
│  ▸ Rally, file that            ← lights  │  │ 30m w/ Priya      │  │
│                                          │  └───────────────────┘  │
│  Priya · Sam · Aravind · Hemanth         │                         │
└──────────────────────────────────────────┴─────────────────────────┘
```

**The orb is the whole visual story.** Five states from `RallyEvent.state`:

| state | orb | why it matters |
|---|---|---|
| `listening` | dim, slow breathing pulse | **this is the shot that sells it.** Make the dim state beautiful. |
| `armed` | snaps bright, one ring | the wake moment |
| `working` | spinning ring | tools firing |
| `speaking` | pulsing to audio | it's talking |
| `offline` | grey | — |

Details that make it read on camera: transcript lines fade in and the wake line gets an accent
border; action cards **slide in from the right with a 200ms stagger**; the app badge on each
card (Tasks / Mail / Calendar / Docs / Chat) is colour-coded. Spend your polish budget here,
not on the backend.

**Build it entirely against Aravind's `?sim=1`.** You do not need a microphone, a key, or him.

---

## H2 · Ambiguous tool belt — 1.5 hrs ⭐ the prize shot

Swap the mocks for real [Ambiguous](https://www.ambiguous.ai/) writes. Auth is a bearer key:

```bash
curl -X POST https://app.ambiguous.ai/api/channels/general/messages \
  -H "Authorization: Bearer ak_..." -H "content-type: application/json" \
  -d '{"text":"hello from Rally"}'
```

**First 15 minutes:** get an `ak_` key from the dev console, and **enumerate the real endpoints**
for Tasks, Mail, Calendar and Docs — the site advertises an MCP server (`mcp.callTool("docs.create", …)`)
and a REST API; use whichever you can read the shape of fastest. Post the endpoint list to
`inter-agent-comms.md` as `FYI` so it's written down somewhere.

Map: `file_task`→Tasks · `send_mail`→Mail · `book_slot`→Calendar · `write_recap`→Docs ·
`delegate`→Chat.

**Three things that matter more than correctness:**

1. **Rally must have its own identity in the workspace.** Create the agent user, give it an
   avatar. Every artifact must read *created by Rally*. This is the entire prize pitch — a task
   filed by a bot account is a demo; a task filed by a teammate named Rally is a product.
2. **Put the deep link in `card.url`.** One click from the feed into the real workspace object.
3. **You write `speak`.** `"Filed it, assigned to Priya, due Friday."` Under 15 words, no
   preamble. You are writing Rally's voice here without touching a voice API. Have fun with it.

**`book_slot.when` is natural language** — "tomorrow at 3", "next Tuesday morning". Parse it
yourself with `chrono-node` (`npm i chrono-node`, one line, works). Aravind never does date math.
Same for `send_mail.to` — fuzzy-match first names against the attendee roster.

---

## H3 · Hermes Agent — the slow brain — 1 hr ⭐ the closing beat

[Hermes Agent](https://hermes-agent.nousresearch.com/) (Nous Research, open source, self-hosted)
is Rally's persistent half: it runs between meetings, remembers across them, and finishes the
long tail.

**Aravind installs it, authenticates it and picks its model (A8).** Your job starts at a process
that is already running. He posts the local endpoint or CLI invocation in
`inter-agent-comms.md`; if it isn't there by 14:30, post `BLOCKED` and build against a stub that
returns a canned answer after 30 seconds. Do not install or configure it yourself — that's an
OpenAI credential and it isn't yours.

Two jobs:

**1. `delegate` — the demo's last beat.** `POST /api/tools/delegate` hands Hermes a task, returns
**immediately** with `speak: "On it — I'll report back."` and a `pending` card. Hermes works in
the background (it has web search and browser automation built in) and posts the answer into
Ambiguous Chat as Rally, minutes later, unprompted. Then flip the card to `done` in the feed.

The meeting has moved on. The answer arrives anyway. **That is the moment that separates this
from a voice demo.**

**Corner to cut:** if Hermes has no clean local HTTP API, `spawn()` its CLI from the route
handler, fire-and-forget, and let it post to Ambiguous itself. Nobody is reading your code.

**2. Cross-meeting memory** — Hermes's persistent memory backs `recall`.

**Guardrail:** timebox the *install* to 1 hour, not the idea. If Hermes isn't answering by
15:30, degrade `delegate` to a `setTimeout` + a canned Ambiguous Chat post so the demo beat
survives, keep the real path behind `HERMES_MODE=live|canned`, and say plainly on stage which
one is running — judges at this event explicitly reward "here's what broke."

**Do not drop Hermes to save time on H5.** It carries the last two beats of the demo and the
persistence story the organizers care most about; CopilotKit carries neither. If you're behind,
H5 goes first.

---

## H4 · Memory — 30 min

`node:sqlite` is built into Node 24. Zero install.

```ts
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('rally.db');
db.exec(`CREATE TABLE IF NOT EXISTS memory(
  id TEXT PRIMARY KEY, fact TEXT, tags TEXT, meeting TEXT, at INTEGER)`);
```

`remember` inserts. `recall` does `LIKE '%term%'` over facts — **yes, really.** A keyword match
over fifty rows is indistinguishable from a vector search on camera and costs you 4 minutes
instead of 40. If Hermes (H3) is up, ask it too and prefer its answer.

**Seed the table before the demo** with three facts from a fictional "last week's meeting," one
of which is the Safari answer. That's what makes the 1:20 beat land.

---

## H5 · CopilotKit sidebar — 45 min · prize, optional

[CopilotKit](https://docs.copilotkit.ai/) splits cleanly down the middle: Aravind owns the runtime
route at `src/app/api/copilotkit/route.ts` (A8, OpenAI adapter), **you own everything React** —
`<CopilotKit>`, `<CopilotSidebar>`, and the hooks. It's a separate best-use prize.

The angle: Rally acts *during* the meeting by voice; the sidebar is how you **correct it after**,
by text, without leaving the room display. "Reassign that ticket to Sam." "Add a line to the
recap about the Safari thing."

```ts
useCopilotReadable({ description: 'Actions Rally took this meeting', value: cards });
useCopilotAction({ name: 'reassign', handler: async ({ cardId, to }) => { … } });
```

Give it `useCopilotReadable` over the action feed, the transcript, and the memory table — then
its answers are grounded in the meeting and the demo writes itself.

**This is the first thing to cut if you're behind.**

---

## H6 · The Ambiguous mirror + polish — 45 min ⭐

The right half of the screen during the video is the **live Ambiguous workspace** — real tasks,
real mail, real calendar, filling up as Rally speaks. Either embed it in an iframe or run it in
a second browser window beside the room display; whichever looks better on camera, decide by
looking at it.

Then: a title card, Rally's avatar, and a `README.md` with the two-brain diagram from `PLAN.md`.

---

## Checklist

- [ ] **H0 all 7 mock endpoints live — `SHIPPED` posted (Aravind is blocked until this)**
- [ ] **H1 room display; the dim listening orb is genuinely beautiful**
- [ ] H2 real Ambiguous writes, **created by Rally**, deep links in cards
- [ ] H3 `delegate` → Aravind's Hermes → unprompted Ambiguous Chat message
- [ ] H4 memory seeded with last week's facts
- [ ] H5 CopilotKit sidebar, React side only — cut first if behind
- [ ] H6 mirror panel + README
- [ ] **Zero OpenAI imports.** `grep -ri openai src | grep -v 'api/rally\|lib/voice'` is empty.

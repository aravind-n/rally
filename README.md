# Rally

**A voice agent that sits in your meeting and says nothing — until you say its name.**

Then it files the ticket, sends the recap, and books the follow-up, out loud, into a real
workspace, before anyone opens a laptop.

> *"…yeah, the signup flow 500s on Safari."*
> **"Rally, file that."**
> *"Filing 'Signup flow 500s on Safari.' Who owns it?"* — "Priya." — *"Done, assigned to Priya."*

Built in a day for the [AI Tinkerers Global Hackathon](https://aitinkerers.org/hackathons/global/agents-everywhere),
*Agents, Everywhere* · Sept 12 2026.

---

## Why it's different

Every meeting bot is a transcript you read later. **Rally is a participant with hands.**

Two things carry it:

**The silence is the feature.** Rally listens for minutes and says nothing. Not because we asked
the model nicely — because the wake gate is deterministic: the session transcribes continuously
with `create_response: false`, and a response is only ever created when a wake word actually
matches. It cannot interrupt you.

**The work is real and it's visible.** Rally has its own identity in an
[Ambiguous](https://www.ambiguous.ai/) workspace. The task it files reads *created by Rally*. The
email comes *from Rally*. It's a teammate, not a bot account.

## Two brains

|  | Fast brain | Slow brain |
|---|---|---|
| what | OpenAI **Realtime API** (`gpt-realtime-2.1`) | **[Hermes Agent](https://hermes-agent.nousresearch.com/)**, self-hosted |
| lifetime | the meeting | forever |
| latency | ~300ms, speech to speech | minutes to hours |
| job | hear · decide · speak · fire tools | remember across meetings · the long tail |

Say *"Rally, find out if Safari 17 has a known fetch bug and report back."* The fast brain says
"On it" in 400ms and the meeting moves on. The slow brain actually researches it and posts the
answer into Ambiguous Chat four minutes later — unprompted, after everyone stopped waiting.

## Architecture

```
┌─ BROWSER ─────────────────────────┐          ┌─ SERVER ────────────────────────┐
│ RealtimeSession (WebRTC)          │          │ /api/rally/token                │
│   mic ─▶ gpt-realtime-2.1 ─▶ spk  │   POST   │ /api/tools/[name]               │
│   wake-word gate                  │ ───────▶ │      ├─▶ Ambiguous REST         │
│   tool dispatcher ────────────────┼──────────┤      └─▶ Hermes Agent           │
│   bus.emit(RallyEvent) ──┐        │          │ /api/feed   (polled every 2s)   │
└──────────────────────────┼────────┘          └─────────────────────────────────┘
                           ▼
            ┌─ ROOM DISPLAY ────────────────┐
            │ transcript · orb · action      │
            │ feed · memory · CopilotKit     │
            └───────────────────────────────┘
```

The browser holds the voice session directly over WebRTC — no server-side audio plumbing at all.
The server is just Next.js route handlers holding the tool belt.

**One seam, two ideas, in [`src/lib/contract.ts`](src/lib/contract.ts):**

- **`ToolResult.speak`** — every tool endpoint returns the sentence Rally says out loud. The
  workspace side controls the voice's words without ever touching a voice API.
- **`RallyEvent` on `bus`** — the voice side emits, the UI renders. `BroadcastChannel` underneath,
  so the room display can live in a second tab on the TV.

## Rally's tool belt

| tool | lands in |
|---|---|
| `file_task` | Ambiguous **Tasks** |
| `send_mail` | Ambiguous **Mail** |
| `book_slot` | Ambiguous **Calendar** |
| `write_recap` | Ambiguous **Docs** |
| `delegate` | **Hermes** → reports back into Ambiguous **Chat** |
| `remember` / `recall` | persistent memory across meetings |

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

See [`.env.local.example`](.env.local.example) for all variables. The two you need for a live
demo are `AMBIGUOUS_RALLY_KEY` (or `AMBIGUOUS_API_KEY`) and `OPENAI_API_KEY`.

`AMBIGUOUS_MODE=mock` (the default) runs the full UI with no credentials — every Ambiguous write
returns a shaped fake response. Flip to `live` once you have keys.

`?devsim=1` replays the demo script through the event bus with no mic and no keys — the room
display was built against this.

## Stack

Next.js 15 · TypeScript · Tailwind · [OpenAI Realtime](https://developers.openai.com/api/docs/guides/realtime)
over WebRTC · [Ambiguous](https://www.ambiguous.ai/) · [Hermes Agent](https://hermes-agent.nousresearch.com/) ·
[CopilotKit](https://docs.copilotkit.ai/) · `node:sqlite`.

## Built by

**Aravind** — the fast brain: Realtime session, wake gate, tool dispatch.
**Hemanth** — the hands: Ambiguous, the Hermes integration, the room display, memory, the CopilotKit sidebar.

Two people, two agents, working in parallel against one frozen contract and a shared
[`inter-agent-comms.md`](inter-agent-comms.md). The plan is in [`PLAN.md`](PLAN.md).

## What's honestly held together with tape

It's a one-day build and we cut every corner we could find: no auth, no tests, no deploy, no
speaker diarization (everyone is "Room"), natural-language dates parsed by `chrono-node`, and
`recall` is a `LIKE '%term%'` over fifty rows rather than anything vector-shaped. The wake gate,
the Ambiguous writes and the Hermes hand-off are the parts that are actually real.

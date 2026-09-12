# RALLY — build plan

> **Rally sits in your meeting and says nothing. When you say its name, it does the thing —
> files the task, sends the recap, books the follow-up — into a real workspace, out loud,
> before anyone opens a laptop.**

AI Tinkerers Global Hackathon · "Agents, Everywhere" · Sept 12 2026
Team: **Aravind** (voice / OpenAI) · **Hemanth** (hands / workspace / UI)

---

## 1. The pitch

Every meeting bot is a transcript you read later. Rally is a **participant with hands**.

Two things make it land:

1. **The silence is the feature.** Rally listens for minutes and says nothing. Then you say
   "Rally, file that" and it moves. Judges have seen a hundred assistants that interrupt.
   They have not seen one with the discipline to shut up.
2. **The work is real and it's visible.** Rally has its own identity in an
   [Ambiguous](https://www.ambiguous.ai/) workspace. The task it files says *created by Rally*.
   The email comes *from Rally*. Split-screen: the room on the left, the workspace filling up
   on the right, live.

### The architecture idea worth saying out loud

Rally has **two brains**:

| | Fast brain | Slow brain |
|---|---|---|
| what | OpenAI **Realtime API** (`gpt-realtime-2.1`) | **Hermes Agent** (Nous Research, self-hosted) |
| lifetime | the meeting | forever |
| latency | ~300ms, speech to speech | minutes to hours |
| job | hear, decide, speak, fire tools | remember across meetings, do the long tail |
| owner | **Aravind** | **Hemanth** |

The fast brain talks. The slow brain remembers and follows through. You say *"Rally, find out if
Safari 17 has a known fetch bug"* — the fast brain says "On it" in 400ms and moves on with the
meeting; the slow brain actually researches it and posts the answer into Ambiguous Chat four
minutes later, **while you're still demoing.** That is the closing beat of the video.

---

## 2. Demo script (freeze this now — everything gets built backwards from it)

Two-minute video. Big screen shows the Rally room display; second half of the screen is the
Ambiguous workspace.

| t | what happens | what it proves |
|---|---|---|
| 0:00 | Three people talking about a launch. Transcript scrolls. Rally's orb is **dim**. | it's listening |
| 0:20 | Still talking. Still dim. Still silent. *Let this sit.* | **the discipline** |
| 0:30 | "…the signup flow 500s on Safari." → **"Rally, file that."** | wake |
| 0:35 | Orb lights. Rally: *"Filing 'Signup flow 500s on Safari.' Who owns it?"* → "Priya." → *"Done, assigned to Priya."* | speech→action→speech |
| 0:45 | **Task appears in Ambiguous Tasks. Creator: Rally.** | it's a teammate, not a bot |
| 0:55 | **"Rally, book thirty minutes with Priya tomorrow and send the group a recap."** | multi-tool, one utterance |
| 1:05 | Calendar event + Mail land in Ambiguous. Rally reads back the recap's first line. | compound action |
| 1:20 | **"Rally, was Safari broken last week too?"** → recalls a fact from a previous meeting. | **persistent memory** |
| 1:35 | **"Rally, look into whether this is a known Safari bug and report back."** → *"On it."* Meeting continues. | delegation |
| 1:50 | An Ambiguous Chat message from **Rally** pops in with the research. Nobody asked again. | **the slow brain lands** |

If you build only rows 0:00–0:45, you still have a demo. Everything after is upside, in order.

---

## 3. Stack (decided, not up for debate)

| layer | choice | why |
|---|---|---|
| language | **TypeScript** | Realtime API's best browser path is JS; CopilotKit is React; one language for both agents |
| app | **Next.js 15 (App Router)**, one repo, one `npm run dev` | route handlers = the backend. No second service. |
| voice | **Realtime API over WebRTC, straight from the browser** | zero server audio plumbing. The single biggest corner cut available. |
| hands | **Ambiguous REST** (`https://app.ambiguous.ai/api/...`, `Authorization: Bearer ak_...`) | agents get identity + Tasks/Mail/Calendar/Docs/Chat out of the box |
| memory + long tail | **Hermes Agent**, self-hosted, on an OpenAI model | persistent, 40+ tools, scheduled automations, subagents |
| copilot | **CopilotKit**, OpenAI adapter, runtime route owned by Aravind | in-app copilot prize; the split keeps Hemanth on the React side only |
| styling | Tailwind + a dark room-display theme | it's going on camera |
| storage | `node:sqlite` (built into Node 24, zero deps) | "persistent memory" on stage, no install |
| deploy | `npm run dev` on Aravind's laptop + `ngrok` if needed | **do not deploy.** Demo is local. |

### Things we are deliberately NOT doing

Auth. Multi-user. Speaker diarization (nice, not needed — label everything "Room").
Tests. Error boundaries. A database migration story. Deployment. Mobile. Dark/light toggle.
Real Google Calendar OAuth (Ambiguous Calendar instead — no OAuth dance).

---

## 4. The seam — how two agents work six hours without talking

Everything crosses at **one file**: `src/lib/contract.ts`. It is already written, it is ~160
lines, and it is frozen at T+0.

```
┌─ BROWSER ─ Aravind ──────────────┐         ┌─ SERVER ─ Hemanth ──────────────┐
│ RealtimeSession (WebRTC)         │         │ /api/rally/token    ← ARAVIND   │
│   mic ─▶ gpt-realtime-2.1 ─▶ spk │  POST   │ /api/tools/[name]   ← HEMANTH   │
│   wake-word gate                 │ ──────▶ │      ├─▶ Ambiguous REST         │
│   tool dispatcher ───────────────┼─────────┤      └─▶ Hermes Agent           │
│   bus.emit(RallyEvent) ──┐       │         │ /api/feed  (polled 2s)          │
└──────────────────────────┼───────┘         └─────────────────────────────────┘
                           ▼
              ┌─ ROOM DISPLAY ─ Hemanth ─────┐
              │ transcript · orb · action     │
              │ feed · memory · CopilotKit    │
              └───────────────────────────────┘
```

**Two contracts, that's all:**

1. **`ToolResult.speak`** — Hemanth's endpoint returns the sentence Rally says out loud.
   Hemanth controls the voice's words without ever touching OpenAI. Aravind never learns
   what Ambiguous is.
2. **`RallyEvent` on `bus`** — Aravind emits, Hemanth renders. `BroadcastChannel` under the
   hood, so the room display can be a second tab on the TV.

**Mock-first, both directions:**

- Hemanth ships all 7 endpoints returning **fake but correctly-shaped** `ToolResult`s in the
  first 45 minutes, then swaps real Ambiguous in behind them. Aravind builds against mocks from
  minute one and never notices the swap.
- Aravind ships **`?sim=1`** — a mode that replays a canned meeting through `bus.emit()` with no
  microphone and no API key. Hemanth builds the entire UI against it. **Hemanth never needs an
  OpenAI key, and the app must boot without one.**

---

## 5. Ownership

**Everything runs on OpenAI models, and every line of OpenAI code is Aravind's.** Those two facts
collide in exactly two places — Hermes's backing model and CopilotKit's runtime adapter — so both
are pulled into Aravind's column as **A8**. Hemanth consumes a configured Hermes process and a
working `/api/copilotkit` route; he never sets a model name, never holds a key, never imports an
OpenAI SDK. If his agent finds itself reaching for one, it stops and posts `BLOCKED` in
`inter-agent-comms.md`. `.env.local` lives only on Aravind's machine.

### Aravind — the fast brain → `AGENT-ARAVIND.md`
`A0` token route · `A1` voice loop · `A2` **wake-word gate** · `A3` tool dispatcher ·
`A4` bus + `?sim=1` · `A5` persona & confirm-out-loud · `A6` context priming · `A7` safety net ·
`A8` OpenAI config surfaces (Hermes model + CopilotKit runtime)

### Hemanth — the hands, the slow brain, the screen → `AGENT-HEMANTH.md`
`H0` scaffold + mocks · `H1` **room display** · `H2` Ambiguous tool belt · `H3` **Hermes Agent** ·
`H4` memory · `H5` CopilotKit sidebar · `H6` Ambiguous mirror + polish

### Joint
`J1` integration (T+2h15) · `J2` rehearsal (T+5h45) · `J3` video, README, post

---

## 6. Timeline — it is 11:45, demo freeze at 18:00

| clock | | Aravind | Hemanth |
|---|---|---|---|
| **11:45–12:15** | **T0 · together** | copy `contract.ts` in, read it aloud to each other, agree the 7 tools. **The only 30 minutes you must be in sync.** | ← same, plus `create-next-app` |
| 12:15–14:15 | sprint 1 | A0 → A1 → **A2** · **A8 Hermes install/auth early — H3 waits on it** | **H0 mocks first (45 min, unblocks Aravind)** → H1 |
| **14:15–14:30** | **check 1** | say "Rally, file that" → a mock card renders on Hemanth's UI | ← same |
| 14:30–16:15 | sprint 2 | A3 → A4 → A5 | H2 Ambiguous → H3 Hermes |
| **16:15–16:45** | **check 2** | **full path live: voice → Ambiguous → screen** | ← same |
| 16:45–17:45 | sprint 3 | A6 → A7 | H4 → H5 → H6 |
| **17:45–18:00** | **FREEZE** | nothing merges. rehearse the script 3×. | ← same |
| 18:00–19:00 | ship | record video · README · social post | ← same |

**Cut order if you're behind** — drop the leftmost thing still standing:
CopilotKit sidebar → `write_recap` → `book_slot` → Hermes's scheduled follow-through →
Hermes `delegate`.

**Never cut:** the wake-word gate · `file_task` · the room display · the Ambiguous mirror ·
`recall`. Note that CopilotKit appears nowhere in §2's demo script and Hermes carries its last
two beats — cut the prize-chasing sidebar long before you touch the second brain.

---

## 7. The three things that will actually go wrong

1. **Rally talks when it shouldn't.** Mitigation is the whole of A2 — do not rely on prompting
   the model to stay quiet. Gate it deterministically in code. This is the #1 risk and the #1
   demo beat; it gets the most senior attention.
2. **Room audio feedback** — Rally hears itself and loops. Mitigation: headphones for the
   operator, `echoCancellation: true` on `getUserMedia`, and hard-mute the mic while
   `state === 'speaking'`. Test this at T+2h, not at 17:50.
3. **Ambiguous API surprises.** Hemanth's mocks stay in the codebase behind
   `AMBIGUOUS_MODE=mock|live`. If live breaks at 17:00, flip the env var and the demo is
   *identical on camera* — the mirror panel renders our own card data either way.

---

## 8. Files

```
rally/                              github.com/aravind-n/rally
├── AGENTS.md                   ← auto-loaded by both agents. the hard rules.
├── PLAN.md                     ← you are here
├── AGENT-ARAVIND.md            ← Aravind's agent reads this + contract + comms. nothing else.
├── AGENT-HEMANTH.md            ← Hemanth's agent reads this + contract + comms. nothing else.
├── inter-agent-comms.md        ← the only channel between them
├── rally-plan.html             ← the same plan, for humans
├── README.md                   ← the submission. judges read this.
└── src/lib/contract.ts         ← FROZEN at T+0. the entire seam.
```

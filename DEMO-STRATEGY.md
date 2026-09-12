# DEMO-STRATEGY.md — Incident War Room

> Rally · AI Tinkerers Global Hackathon · "Agents, Everywhere" · Sept 12 2026

---

## The Scene

**Setting:** Production is down. Payments API throwing 500s. Three people on a bridge call.
**Cast:** Alex (oncall), Priya (payments lead), Sam (infra).
**Rally:** Dim orb on the room display. Listening. Silent.

Open `localhost:3000/?split=1` for the full split-screen: room display left, Ambiguous workspace right.
Run `?devsim=1` to replay the full script without a microphone.

---

## The Demo Opener — Before You Say a Word

The first thing the audience sees is the mirror panel showing an Ambiguous Chat message,
already posted **2 days ago** by **Rally**:

> *"Team — the November 14 connection pool fix (max_connections=500) is due for a quarterly
> review. No action was taken after the December check-in was missed. Flagging before it
> becomes an incident again. — Rally"*

You say: *"Rally sent this on its own, two days ago. Nobody asked. Let me show you where it
came from."*

The time-loop: the audience is about to watch the incident that Rally warned about. The
slow-brain message that arrives at 1:50 is the same mechanism — proven before the demo starts.

---

## The 2-Minute Script

| t | beat | what the audience feels |
|---|---|---|
| 0:00 | Mirror panel shows Rally's 2-day-old warning. | *It already worked before the demo.* |
| 0:10 | *"Let me show you where this came from."* | Framing. |
| 0:15 | Alex: "payments are down." Priya: "500s on checkout." Sam: "DB looks fine." Orb dim. | Stakes established immediately. |
| 0:30 | *"Rally, open a P0 — payments API down, assign to Priya."* Orb lights. | Relief — someone is handling it. |
| 0:40 | **P0 task appears in Ambiguous. Created by Rally. Assigned to Priya. Urgent.** | It's real. It's already in the system. |
| 0:50 | *"Rally, send customers a notice we're aware of payment issues."* → Mail sent. | Rally is managing comms too. |
| 1:05 | *"Rally, did we see this pattern in a previous outage?"* → Rally recalls: *"November 14 — connection pool exhaustion, pool maxed at 100, fixed by increasing to 500."* | **The room pauses.** An answer from a meeting a month ago. |
| 1:20 | *"Rally, tell customers payments are back up and operational."* | Routine. Nobody is worried. |
| 1:21 | **Rally:** *"I can't send that — the incident is still marked investigating."* | **Silence.** |
| 1:30 | *"Rally, file the payments incident as resolved."* → Filed. Status flips. *"Now send the all-clear."* → Sent. | The veto was intelligent. It adapted. |
| 1:45 | *"Rally, look into whether this matches November and report back."* → *"On it."* Meeting moves on. | Delegation. |
| 1:55 | Ambiguous Chat message from **Rally**: *"Pattern confirmed — connection pool exhaustion. Fix: max_connections=500, restart app tier. 12 minutes to resolve. — Rally"* | Time loop closes. The opening warning makes complete sense. |

**Closing line:**
> *"Rally doesn't interrupt the incident call. It doesn't summarize it. It opens the ticket,
> manages the comms, remembers the last time this happened, refuses to send a false all-clear,
> and keeps researching after you move on. That's not a voice assistant. That's a teammate
> that's been in every incident you ever had."*

---

## What Makes It Win

### The Veto
No other demo will show an AI agent that refuses a request. When Rally says *"I can't send
that"* — judges lean forward. When it then adapts (files the resolution, sends the all-clear)
— they understand the product.

### The Recall
"Did we see this pattern before?" answered from a meeting a month ago. This is the feature
that turns Rally from a voice-to-action pipe into institutional memory. The answer arrives
in under a second. No one opened a browser.

### The Time Loop
The demo opens with proof. A slow-brain message from 2 days ago sits in the workspace
before the first word is spoken. The closing beat (Hermes answering 90 seconds into the
delegate) is the same mechanism, live. Skeptical judges can't dismiss something that
already happened.

### The Stakes
Production is down. Money is not flowing. Everyone in the room understands this without
explanation. Every beat lands harder than the same beat in a project management demo.

---

## How to Run

```bash
# Full war room demo (split screen + auto-replay, no mic needed)
open "http://localhost:3000/?split=1&devsim=1"

# Aravind's scripted sim (voice path, no mic needed)
open "http://localhost:3000/?sim=1"

# Split screen + Aravind's sim
open "http://localhost:3000/?split=1&sim=1"

# Live voice (Chrome speech, mic required)
open "http://localhost:3000/?split=1"

# Keyboard overrides (live or sim mode): W=wake  S=stop  1-7=canned tools
```

## What Is Honestly Tape

- **Recall is `LIKE '%term%'`** over the three seeded incident facts, not a vector search. On camera, indistinguishable from semantic search.
- **The November message** in the mirror panel is a static HTML mock, not a real Ambiguous Chat message. The Hermes answer at 1:55 is the real mechanism.
- **Hermes canned mode**: the research answer is pre-written and fires after a 30-second timeout. `HERMES_MODE=live` routes to the real Hermes gateway when Aravind's A8 is up.
- **AMBIGUOUS_MODE=mock**: all workspace writes return shaped mock data. Flip to `live` once the `ak_` key is in `.env.local`.

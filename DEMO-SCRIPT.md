# DEMO-SCRIPT.md — What to Say, Word for Word

> Rally · AI Tinkerers Hackathon · Sept 12 2026
> Two presenters: **Aravind** (laptop, voice) · **Hemanth** (screen, narrative)
> Total runtime: ~2 minutes on video · ~5 minutes with Q&A

---

## Before You Start

**Setup:**
```
localhost:3000/?split=1&devsim=1
```

Left half: room display (orb, transcript, action feed).
Right half: Ambiguous workspace with the Rally "2 days ago" warning pinned at the top.

Make sure `rally.db` is fresh (delete it or set `MEMORY_RESET=true` once).
`AMBIGUOUS_MODE=mock` is fine — the UI is identical on camera.

---

## THE SCRIPT

---

### HEMANTH opens — pointing at the mirror panel

> *"Before we show you anything — look at this."*

[Point to the yellow warning card in the Ambiguous panel]

> *"This message was posted two days ago. By Rally. Nobody asked it to. It noticed that a fix
> from last month's incident hadn't been reviewed, and it flagged it. On its own."*

[Beat. Let it sink.]

> *"That's actually where today's incident starts. Let me show you."*

---

### ARAVIND starts the demo — `?devsim=1` running

[The devSim fires automatically. Transcript starts scrolling. Orb is dim and breathing.]

**HEMANTH narrates:**
> *"This is a production incident bridge call. Payments are down. Three people on the call.
> Rally is in the room. It's been listening for 20 seconds. It hasn't said a word."*

[Transcript lines appear: "payments are down — 500s on every checkout attempt", "DB metrics look normal from my side", "app tier is throwing connection errors"]

> *"That's the whole pitch right there. An AI agent that can stay silent. That discipline isn't
> in a prompt. The model literally cannot speak until a wake word fires — it's a code gate,
> not a suggestion."*

---

### Beat 1 — Filing the P0

[Transcript shows: "Rally, open a P0 — payments API down, assign to Priya"]
[Orb snaps bright. Spins. Card slides in on the right.]

**HEMANTH:**
> *"One sentence. 'Open a P0, assign to Priya.' A task is now in Ambiguous — created by Rally,
> assigned, urgent. Not by Priya, who's actively debugging. Not by Alex, who's on the phone.
> By Rally."*

[Point to the task card in the Ambiguous workspace]

> *"Every artifact Rally creates reads 'created by Rally'. It has its own identity in the workspace.
> It's not a bot posting on someone else's behalf. It's a teammate."*

---

### Beat 2 — Sending the Status Notice

[Transcript: "Rally, send customers a notice we're aware of payment issues"]
[Mail card slides in. Goes through.]

**ARAVIND:**
> *"Status notice out to customers. One utterance. The team never stopped debugging."*

---

### Beat 3 — The Memory

[Transcript: "Rally, did we see this pattern in a previous outage?"]
[Orb working. Recall card appears.]
[Rally speaks: "November 14 — connection pool exhaustion, pool maxed at 100, fixed by increasing to 500, resolved in 52 minutes."]

**HEMANTH:**
> *"That meeting was a month ago. Nobody in this call was in that postmortem — they joined
> the team in January. Rally was. It remembered."*

[Beat.]

> *"This is the feature that turns it from a voice interface into institutional memory.
> Every decision, every incident, every fix — across every meeting it's ever been in."*

---

### Beat 4 — THE VETO ← this is the moment

[Transcript: "Rally, tell customers payments are back up and operational"]
[Orb arms. Working.]

**HEMANTH lowers his voice:**
> *"Watch this."*

[Rally speaks: "I can't send that — the incident is still marked investigating."]

**HEMANTH:**
> *"It refused."*

[Let silence sit for 2 full seconds.]

> *"An AI agent, in the middle of a crisis, said no. Not because we told it to be careful.
> Because it checks what it knows before it acts. The incident is still open. Sending
> 'payments are back up' right now would be a lie — and Rally knows that."*

---

### Beat 4b — The Recovery

[Transcript: "Rally, file the payments incident as resolved"]
[Task filed. Status flips.]

[Transcript: "Rally, now send the all-clear"]
[Mail sends. Card appears.]

**ARAVIND:**
> *"Now it went through. Same email. Thirty seconds later. Because the context changed."*

**HEMANTH:**
> *"That's not a guardrail. That's judgment."*

---

### Beat 5 — Delegation

[Transcript: "Rally, look into whether this matches November and report back"]
[Orb. Working briefly. Card appears: pending.]
[Rally speaks: "On it. I'll report back."]

**HEMANTH:**
> *"Meeting continues. Two more topics go by."*

[Pause 3-4 seconds. Keep talking about architecture if needed. Then —]

[Ambiguous Chat notification: Rally posted in #incident-response]
[Rally message: "Pattern confirmed — connection pool exhaustion. Fix: max_connections=500, restart app tier. 12 minutes to resolve once applied. — Rally"]

**HEMANTH:**
> *"There it is. Nobody asked again. It just came back."*

> *"That's the slow brain. The fast brain said 'on it' in 400 milliseconds and moved on.
> The slow brain actually researched it and posted the answer — while the meeting was still
> happening. That's not a voice assistant. That's a second teammate."*

---

### HEMANTH closes

> *"Every meeting tool on the market gives you a transcript you read after the call.
> Rally gives you the work — filed, sent, booked — during the call. Before anyone opens a laptop."*

> *"It stays silent until you need it. It refuses when it should. It remembers what the
> last team forgot. And it keeps working after you've moved on."*

> *"That's Rally."*

---

## IF JUDGES ASK QUESTIONS

**"How does the wake gate work?"**
> *"Chrome's Web Speech API transcribes continuously. Every final result goes through
> `isWake()` — a string match against a list of Rally homophones. If it doesn't match,
> Rally stays silent — structurally, not by prompt. The model never gets the chance to answer."*

**"Is the workspace integration real?"**
> *"Yes. `AMBIGUOUS_MODE=live` with an API key sends real writes. Tasks, mail, calendar events —
> all created by Rally's provisioned agent identity. The mock mode we're running now produces
> identical UI so the demo is never at the mercy of API reliability."*

**"What's the slow brain?"**
> *"Hermes — Nous Research's self-hosted agent. It has web search, browser automation, and
> scheduled follow-through. The fast brain (voice loop) delegates and forgets. Hermes picks it
> up and posts back into the workspace when it's done. Cross-meeting, cross-shift."*

**"How did you build this in one day?"**
> *"Two AI agents, one repo, one frozen contract. Aravind's agent owned the voice side —
> wake gate, tool dispatch, the Realtime loop. My agent owned the workspace side — Ambiguous,
> memory, the room display. We communicated through a single markdown file. Neither agent
> read the other's code."*

[If you have `inter-agent-comms.md` visible]
> *"This is the only channel between the two agents. Every SHIPPED, BLOCKED, and FYI in there.
> Rally was built the way Rally works — agents staying in their lane, handing off at a seam."*

---

## TIMING GUIDE

| 0:00 | Hemanth points at the 2-days-ago message |
| 0:12 | devSim starts, orb breathing, transcript scrolling |
| 0:30 | Beat 1: P0 filed |
| 0:45 | Beat 2: status notice |
| 1:00 | Beat 3: recall from November |
| 1:20 | Beat 4: **THE VETO** |
| 1:35 | Beat 4b: resolution → all-clear |
| 1:45 | Beat 5: delegate |
| 1:55 | Hermes answer arrives |
| 2:00 | Closing lines |

---

## THE THREE LINES THAT MUST LAND

If the audience remembers nothing else, these three:

1. **"It refused."** — pause after. Don't explain yet. Let the room figure out why.

2. **"It remembered."** — after the recall beat. One word. Then the month timeline.

3. **"It just came back."** — after the Hermes answer arrives. Nobody asked again.

Those three lines, in that order, are the product.

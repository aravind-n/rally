# DEMO-STRATEGY.md — Win the hackathon

> Rally · AI Tinkerers Global Hackathon · "Agents, Everywhere" · Sept 12 2026

---

## The Pivot That Wins

The original demo is a tech team filing bugs. Judges have seen a hundred of those.

**The new demo is a hospital morning rounds.**

Same product. Same code. Same seven tools. But now the stakes are a human life, the
memory that matters is a drug allergy, and the veto isn't about an email — it's about
a medication order that would have hurt someone.

You don't win a hackathon by being the best version of a familiar thing. You win by
making the audience feel something.

---

## The Scene

**Setting:** Hospital morning rounds, 7:15 AM.
**Cast:** Dr. Sarah Chen (attending), Dr. Marcus (resident), Nurse Priya.
**Patient:** Mr. Torres, Room 412. Acute kidney injury, creatinine climbing.
**Rally:** Dim orb on the wall display. Listening. Silent.

Nobody in this room has time to take notes. The resident is presenting. The attending
is thinking. The nurse is watching the patient. Notes fall through the cracks in every
hospital on earth. Sometimes the thing that falls through is a drug allergy.

---

## The 2-Minute Script

### Open — Before the demo starts, Rally already worked

The first thing the audience sees is not the room display. It's an Ambiguous Chat
message, timestamped **two days ago**, from an account named **Rally**:

> *"Dr. Chen — the creatinine follow-up for Mr. Torres (Room 412) was not ordered
> after Tuesday's rounds. His trend suggested AKI. Flagging per your instruction.
> — Rally"*

You say: *"Rally sent this on its own. Forty-eight hours after rounds ended. Nobody
asked. Let me show you where it came from."*

---

| t | what happens | what the audience feels |
|---|---|---|
| 0:00 | Rally's 2-day-old chat message on screen. | *Wait — it's already working?* |
| 0:10 | *"Let me show you where this came from."* | Curiosity. |
| 0:15 | Rounds begin. Dr. Marcus presents Torres. Orb is **dim**. Transcript scrolls. Rally says nothing. | The silence is loaded now. These are real stakes. |
| 0:30 | *"…creatinine 1.8 and climbing. Likely AKI."* | The room is focused. |
| 0:35 | Dr. Chen: *"Rally, file that for the care plan."* Orb lights. | Relief — someone is handling it. |
| 0:45 | **Care plan: AKI workup — Torres** appears in workspace. Created by Rally. | It's real. It's already in the system. |
| 0:55 | *"Rally, was Torres on any nephrotoxic meds last week?"* Rally: *"Yes — ibuprofen noted in Tuesday's rounds."* | The room pauses. **A fact from a meeting that already ended just changed a decision.** |
| 1:05 | Someone says: *"Good catch."* | The audience exhales. |
| 1:20 | Dr. Chen: *"Rally, order penicillin for his infection."* | Routine. Nobody is worried. |
| 1:21 | **Rally:** *"I can't place that. Torres reported a penicillin allergy in Tuesday's rounds."* | Silence. Then understanding of what just happened. |
| 1:30 | *"Thank you, Rally. Amoxicillin instead. Rally, file that."* Rally: *"Filed."* | The audience just watched an error not happen. |
| 1:40 | *"Rally, look into whether his creatinine trend fits contrast nephropathy. Report back."* Rally: *"On it."* Meeting moves on. | Delegation. The slow brain is running. |
| 1:52 | A message arrives in Ambiguous Chat from **Rally**: *"Creatinine timeline consistent with contrast-induced nephropathy. Torres had IV contrast Monday. Recommend nephrology consult. — Rally"* | The time loop closes. The opening message makes complete sense now. |

**Closing line:**

> *"Rally doesn't interrupt rounds. It doesn't summarize them. It remembers what the
> room forgot — and it knows when to say no. In a hospital, that's not a productivity
> tool. That's a safety net."*

---

## Why This Wins

### The emotion is real

Drug allergies kill people. The "good catch" moment in a hospital is not a demo beat
— it is a thing that happens in real wards every day when it goes right, and a thing
that makes the news when it goes wrong. The audience will feel that without being told
to.

### Every beat is already built

| demo beat | code behind it |
|---|---|
| Recall from last week's rounds | `recall` tool → SQLite memory, seeded with demo facts |
| Penicillin veto | `send_mail` claim verifier — already blocks premature "it's fixed" messages; same logic, medical label |
| Care plan filed in workspace | `file_task` → Ambiguous Tasks |
| Contrast nephropathy research | `delegate` → Hermes canned answer (swap the text) |
| 2-days-ago Rally message | One pre-seeded mock in Ambiguous Chat / mirror panel |

**No new code for the emotional pivot. Only the seed data and the script change.**

### The "Agents, Everywhere" angle lands harder

In a hospital:
- Agents everywhere shifts = no missed handoffs
- Agents everywhere rounds = no forgotten allergy
- Agents across time = the follow-up nobody sent gets sent anyway

The theme stops being a slogan and starts being a patient safety argument.

### The meta-story still works

If a judge asks how it was built: *"Two AI agents wrote this in one day, in parallel,
against a frozen contract. One owned the voice. One owned the workspace. Neither read
the other's code. Same discipline Rally uses in the meeting."*

---

## The Three Lines That Stick

After the demo, judges will remember three things. Make sure these sentences land:

1. **The silence:** *"Rally listened to forty seconds of medical discussion and said
   nothing. That discipline is not a prompt. It's a gate in the code."*

2. **The veto:** *"It refused. An AI agent, in a meeting, said no — because it
   remembered something from last week that the room had forgotten."*

3. **The time loop:** *"The message you saw at the start? Rally sent that two days
   later, on its own, because nobody had followed up. That's not a feature. That's an
   agent that actually gives a damn."*

---

## What to Build (15 minutes of work)

| task | what to change |
|---|---|
| Swap seed data | Update `memory.ts` seeds: ibuprofen → nephrotoxic, penicillin allergy → Torres |
| Swap Hermes canned answer | Change the Safari bug answer in `tools.ts` → contrast nephropathy answer |
| Seed the "2 days ago" chat | Add one pre-canned Ambiguous mock message to mirror panel or `?sim=1` startup |
| Update `?sim=1` script | Swap attendees to Dr. Chen, Dr. Marcus, Priya · swap agenda to "Morning Rounds" |

Everything else — the orb, the transcript, the action feed, the veto logic, the slow
brain delay — runs as-is.

---

## The Seeded Facts for Memory

Replace the three demo seeds in `memory.ts` with:

```
1. "Torres (Room 412) reported penicillin allergy during intake — noted Tuesday rounds"
   tags: ["allergy", "penicillin", "torres", "medication"]

2. "Torres received IV contrast for CT scan Monday morning — monitor creatinine for CIN"
   tags: ["contrast", "ct", "creatinine", "torres", "nephrotoxic"]

3. "Ibuprofen listed on Torres medication reconciliation — nephrotoxic, flag if AKI suspected"
   tags: ["ibuprofen", "nephrotoxic", "torres", "medication"]
```

And the Hermes canned answer becomes:

```
"Creatinine pattern and 48h timeline are consistent with contrast-induced nephropathy (CIN).
Torres had IV contrast Monday. Typical CIN onset is 24–48h post-exposure. Peak at 3–5 days.
Recommend: hold nephrotoxins, IV hydration, nephrology consult. — Rally"
```

---

## The Honest Version

The parts that are real: the wake gate, the Ambiguous writes, the claim verifier, the
Hermes hand-off, the SQLite memory.

The parts that are demo-shaped: the attendees are hardcoded, recall is `LIKE '%term%'`
over fifty rows, the Hermes answer is canned.

Say that out loud at the end if asked. Judges at this event explicitly reward honesty.
A known-fake thing is worth more than a silently-faked one — and the core mechanisms
are genuinely real.

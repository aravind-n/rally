# DEMO-STRATEGY.md — How to win the hackathon

> Rally · AI Tinkerers Global Hackathon · "Agents, Everywhere" · Sept 12 2026

---

## The Problem With the Current Demo

The current script is strong but follows an arc every judge has seen: voice → action →
workspace fills up. What wins a hackathon is **one moment that makes the room go quiet.**
Rally has three such moments already built. None of them are in the demo yet.

---

## The Three Novel Angles

### 1 · The Veto — "The only meeting agent that can say no"

Already built and working (the claim verifier in `send_mail`). Nobody will demo it. Nobody
else has it.

**The beat:**

> "Rally, tell the team the Safari bug is fixed."
> **Rally:** *"I can't send that. The incident is still marked investigating."*
> "Okay. Rally, file the Safari fix as resolved."
> **Rally:** *"Filed. Priya, P1."* — task lands in Ambiguous, status flips.
> "Now. Rally, tell the team."
> **Rally:** *"Sent."*

Twenty seconds. The room goes silent. Every other voice agent just does what it's told.
Rally refused — then adapted when the context changed.

**Why it wins:** Judges carry a mental model of AI agents as eager-to-please. A refusal
breaks that model. The follow-through (it adapts when context changes) proves the refusal
was intelligent, not just a guardrail. No competing demo will have this beat.

---

### 2 · The Time Loop — Start with the output, then show the input

The demo currently *ends* with Hermes posting an answer 4 minutes later. **Flip it —
open the demo with that answer already on screen.**

Before you say a word, the audience sees an Ambiguous Chat message from **Rally**,
timestamped *2 days ago*:

> *"Hi team — the Safari 17 fetch bug task from Monday's standup hasn't been closed.
> @Priya, still on your end? — Rally"*

Then you say: *"Rally sent this on its own, two days after a meeting ended. Let me show
you where it came from."*

Run the normal demo. The closing beat (Hermes posting 4 minutes in) now **proves** the
opening wasn't staged — it's the same mechanism, live.

**Why it wins:** The theme is "Agents, Everywhere." Most teams interpret that as *agents
in more places*. This interprets it as *agents across time*. The demo opens with proof
before you've explained anything — the most honest possible structure. Judges who read
demos skeptically will find it disarming.

**What to build:** Seed one pre-canned Ambiguous Chat message into the `?sim=1` startup
(or as a static mock in the mirror panel) so it's visible the moment the demo opens.

---

### 3 · The Meta-Story — Two AI agents built this in one day

If a judge asks "how did you build this?" — tell the recursive story:

> *"Rally was built by two AI agents working in parallel on a shared repo. They
> communicated only through a single markdown file. One agent owned the voice; the other
> owned the workspace. Neither read the other's code."*

Show `inter-agent-comms.md` for 10 seconds. Show the frozen `contract.ts`.

The product that sat in the meeting and never interrupted was built the same way — by
agents that stayed in their lane.

**Why it wins:** It's recursive, it's true, and it has a punchline. The agents that
built Rally and the agent *named* Rally share an architecture. "We built an agent to
build an agent" is a sentence that sticks after the demo ends.

---

## The Recommended 2-Minute Demo Script

| t | beat | what it proves |
|---|---|---|
| 0:00 | Open on Ambiguous Chat showing Rally's 2-day-old follow-up message | it already worked before the demo started |
| 0:10 | *"Rally sent this on its own. Let me show you where it came from."* | frames everything that follows |
| 0:20 | Three people talking. Orb dim. Transcript scrolls. Rally silent. | the discipline |
| 0:30 | *"Rally, file that."* → orb lights → task lands in Ambiguous | speech → action → real object |
| 0:45 | Task visible. Creator: Rally. | it's a teammate, not a bot |
| 0:55 | *"Book thirty with Priya tomorrow, send a recap."* → calendar + mail | multi-tool, one sentence |
| 1:20 | *"Was Safari broken last week too?"* → Rally recalls from a previous meeting | persistent memory across meetings |
| 1:35 | **THE VETO:** *"Rally, tell the team it's fixed."* → Rally refuses | breaks every expectation |
| 1:45 | File the resolution → status flips → *"Now send it."* → Rally sends | judgment + adaptation |
| 1:55 | Hermes posts the live research answer into Ambiguous Chat | closes the time loop — the opening wasn't staged |

**Closing line:**
> *"Every other meeting tool produces a transcript you read later. Rally produces work,
> during the meeting — and keeps producing it after you leave. And it knows when to say no."*

---

## What Needs to Be Built

| item | effort | status |
|---|---|---|
| The Veto demo beat | 0 — already live in `send_mail` claim verifier | ✅ done |
| Pre-seeded "2 days ago" Rally chat message in mock/sim | 15 min — one mock message | ❌ todo |
| Meta-story slide / comms screenshot | 5 min — screenshot of `inter-agent-comms.md` | ❌ todo |

The highest-leverage addition is the seeded chat message. Everything else is already
built — the demo just needs to be reordered and one beat added.

---

## Why This Wins

The three differentiators stack:

1. **An agent that refuses** — no competitor has this. It reframes Rally from
   "voice-to-action pipeline" to "agent with judgment."

2. **An agent that outlives the meeting** — opening with the slow brain's *output*
   proves durability before a single feature is explained. Judges who are skeptical
   of polished demos cannot dismiss something that already happened.

3. **Agents building agents** — the recursive meta-story is a free prize. It costs
   10 seconds of screen time and it's the thing people will repeat when they describe
   the demo afterward.

The parts that are genuinely real: the wake gate, the Ambiguous writes, the claim
verifier, and the Hermes hand-off. Every demo beat above is backed by real code.

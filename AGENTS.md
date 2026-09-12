# AGENTS.md

**Rally** — a voice agent that sits in your meeting, says nothing, and when you say its name
files the ticket, sends the recap and books the follow-up. Hackathon build, one day, two people
working in parallel with their own agents.

## Read this first, every session

1. **`inter-agent-comms.md`** — the only channel between the two agents. Read it before you start
   a task. Append to it when anything crosses the seam. Never DM, never assume.
2. **Your task file** — `AGENT-ARAVIND.md` *or* `AGENT-HEMANTH.md`. Read only yours.
3. **`src/lib/contract.ts`** — the frozen interface. Both sides import from it.

`PLAN.md` has the product, the demo script and the timeline. `rally-plan.html` is the same thing
for humans.

## The split

| | owns | never touches |
|---|---|---|
| **Aravind** | everything OpenAI: Realtime API, voice loop, wake-word gate, tool dispatch, `?sim=1` | Hemanth's endpoints, the UI |
| **Hemanth** | everything else: Ambiguous, Hermes Agent, the room display, memory, CopilotKit | `src/app/api/rally/`, `src/lib/voice/`, `src/components/VoiceController.tsx` |

> ### 🚫 Hemanth's agent: no OpenAI. At all.
> No OpenAI SDK, endpoint, key, or model name. The app must boot and the UI must fully work with
> no `OPENAI_API_KEY` present — build against Aravind's `?sim=1` mode. If a task seems to need
> one, **stop and post `BLOCKED` in `inter-agent-comms.md`.** That work is Aravind's.
> LLM calls that are genuinely yours (CopilotKit, Hermes) go to **Anthropic** or **OpenRouter**.

## How to work here

**This is a hackathon. Speed beats correctness beats elegance.** Ship the thing that looks right
on camera.

- **Cut every corner.** No tests, no error boundaries, no auth, no migrations, no deploy. In-memory
  arrays are fine. `LIKE '%term%'` is fine instead of a vector search. Hardcode the demo data.
- **Mock first, always.** Ship the fake-but-correctly-shaped version in the first hour so the other
  agent is unblocked, then swap the real thing in behind it. Keep the mock behind an env flag
  forever — it's the demo insurance policy.
- **Additive changes only.** It is always faster to add an optional field than to change one. If you
  must break `contract.ts`, post `CONTRACT` in comms and wait for `ACK`.
- **Never block.** If you're waiting on the other agent, mock it and keep moving.
- **Commit often, small messages, straight to `master`.** No branches, no PRs, no review.
- **When something breaks, write it down in comms.** Judges at this event explicitly reward
  "here's what broke" — a known-broken thing is worth more than a silently-faked one.

## Stack

Next.js 15 (App Router, `src/`, TypeScript, Tailwind) · OpenAI Realtime over browser WebRTC ·
[Ambiguous](https://www.ambiguous.ai/) REST for the workspace · [Hermes Agent](https://hermes-agent.nousresearch.com/)
for persistent memory and async work · CopilotKit on the Anthropic adapter · `node:sqlite`.
One repo, one `npm run dev`, runs on a laptop. Do not deploy.

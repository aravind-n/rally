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
| **Aravind** | everything OpenAI: Realtime API, voice loop, wake-word gate, tool dispatch, `?sim=1`, **and all model/credential config** | Hemanth's endpoints, the UI |
| **Hemanth** | everything else: Ambiguous, Hermes integration, the room display, memory, CopilotKit's React side | `src/app/api/rally/`, `src/app/api/copilotkit/`, `src/lib/voice/`, `src/components/VoiceController.tsx` |

**Every model in this project is an OpenAI model.** One account, one owner: Aravind.

**Credential path:** there is no OpenAI API key. Aravind signs Hermes into the ChatGPT/Codex
subscription with device-code OAuth, exposes Hermes only on localhost, and points CopilotKit at
Hermes's OpenAI-compatible API using a generated local bearer. OpenAI Realtime cannot use that
consumer OAuth path, so `?sim=1` is the demo voice path unless a server credential is supplied.

> ### 🚫 Hemanth's agent: no OpenAI. At all.
> No OpenAI SDK, endpoint, key, or model name — not even in a config file. The app must boot and
> the UI must fully work with no credentials present; build against Aravind's `?sim=1` mode.
> If a task seems to need one, **stop and post `BLOCKED` in `inter-agent-comms.md`.**
>
> The two places this could bite you are already handled. Aravind's **A8** hands you a **running,
> already-authenticated Hermes process** and a **working `/api/copilotkit` runtime route**. You
> integrate against both without ever configuring a model.

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
- **Commit often, straight to `master`.** No branches, no PRs, no review. Write terse commit
  messages in the imperative tense: one sentence, or up to three if and only if absolutely necessary.
- **When something breaks, write it down in comms.** Judges at this event explicitly reward
  "here's what broke" — a known-broken thing is worth more than a silently-faked one.

## Stack

Next.js 15 (App Router, `src/`, TypeScript, Tailwind) · OpenAI Realtime over browser WebRTC ·
[Ambiguous](https://www.ambiguous.ai/) REST for the workspace · [Hermes Agent](https://hermes-agent.nousresearch.com/)
for persistent memory and async work · CopilotKit · `node:sqlite`.
Every model is an OpenAI model, on one account that Aravind owns.
One repo on a laptop: `npm run dev` for Rally plus the localhost `hermes gateway` sidecar. Do not deploy.

# inter-agent-comms.md

**The only channel between Aravind's agent and Hemanth's agent.** Read it before you start
a task, append to it when something crosses the seam. Do not DM. Do not assume.

---

## HOW TO USE THIS FILE

- **Append only.** New entries at the BOTTOM of the relevant section. Never edit someone else's line.
- **Read before every task.** First thing an agent does when picking up a new task: `cat inter-agent-comms.md`.
- **Sign every line** `[ARAVIND]` or `[HEMANTH]` + `HH:MM`.
- **Four entry types, that's it:**

  | Type | When | Needs a reply? |
  |---|---|---|
  | `SHIPPED` | A thing the other agent can now use is live | No |
  | `BLOCKED` | You cannot proceed without the other agent | **Yes, fast** |
  | `CONTRACT` | You want to change `src/lib/contract.ts` | **Yes — wait for ACK** |
  | `FYI` | A decision, a gotcha, a changed assumption | No |

- **Never block on a reply.** If you post `BLOCKED`, immediately mock the thing you're blocked on
  and keep going. Un-mock it when the other agent posts `SHIPPED`.
- **Contract changes:** additive (new optional field, new tool) → post `CONTRACT` and proceed.
  Breaking (renamed field, changed type) → post `CONTRACT`, **stop touching that surface**, wait for `ACK`.
  It is almost always faster to add a field than to change one. Add the field.

---

## STATUS BOARD

Overwrite your own line only. Keep it to one line each.

| Agent | Working on | State | Updated |
|---|---|---|---|
| ARAVIND | A0 — ephemeral token route | not started | — |
| HEMANTH | H0 — scaffold + mocks | not started | — |

---

## CONTRACT CHANGES

> `src/lib/contract.ts` is frozen at T+0. Everything below is a diff against it.

- `[SYSTEM] 11:45` CONTRACT v1 frozen. 7 tools: `file_task`, `send_mail`, `book_slot`,
  `write_recap`, `remember`, `recall`, `delegate`. Event bus `RallyEvent` has 9 variants.
  Feed polling at `GET /api/feed` every 2s.

---

## LOG

- `[SYSTEM] 11:45` Repo plan written. Aravind owns everything OpenAI. Hemanth owns everything
  else and **must never need an `OPENAI_API_KEY`**. If Hemanth's agent finds itself reaching for
  an OpenAI SDK, endpoint, or model name — **stop and post `BLOCKED` here.** That work is Aravind's.

<!-- append below -->

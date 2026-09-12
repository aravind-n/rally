# Rally — Two-Minute Demo Video

Two presenters: **Aravind** drives and speaks the commands; **Hemanth** narrates. Rally never
speaks aloud. Its transcript, state changes, confirmations, and workspace artifacts tell the
story.

## Before recording

1. Restart the app once to clear the in-memory feed and reset the incident to `investigating`.
2. Open **Chrome** to `http://localhost:3000/?split=1` and allow microphone access.
3. Use a 16:9 window, hide bookmarks, notifications, and the mouse pointer when it is idle.
4. Confirm the header says **Listening** and say one ordinary sentence. It should appear in the
   transcript without triggering an action.
5. Keep the real Ambiguous workspace open in a second tab. If desired, cut to it briefly after
   the first task lands; do not try to embed it because Ambiguous blocks iframes.
6. Speak every Rally command slowly and exactly as written. Wait for its card before continuing.

The right-side Ambiguous activity mirror is the primary visual proof. Rally is silent by design,
so do not wait for audio confirmations.

## Camera-ready script

### 0:00–0:12 — The hook

**On screen:** Rally room display. Orb dim, state **Listening**, no cards yet.

**HEMANTH:**

> Every meeting bot gives you a transcript after the meeting. Rally does the work during it.
> And its first feature is knowing when to stay silent.

### 0:12–0:27 — Prove the silence

**ARAVIND, as a meeting participant:**

> Payments are down. We're seeing 500s on every checkout.

**HEMANTH, as a second participant:**

> Database metrics look normal. The app tier is throwing connection errors.

**On screen:** Both lines scroll into the transcript. Rally remains **Listening** and creates
nothing.

**HEMANTH:**

> It heard all of that, but it did not interrupt. Silence is enforced in code until it hears its
> name.

### 0:27–0:43 — Put Rally to work

**ARAVIND:**

> Rally, open a P0 — payments API down, assign to Priya.

**On screen:** The command gains the wake accent, the orb changes from **Listening** to **Heard
you** to **On it**, and a blue urgent task appears as **created by Rally**.

**HEMANTH:**

> One sentence became a real urgent task in Ambiguous. The engineers never stopped debugging.

### 0:43–0:59 — Compound action

**ARAVIND:**

> Rally, book thirty minutes with Priya tomorrow and send the group a recap.

**On screen:** Two actions run from the same utterance. Calendar and Mail cards appear.

**HEMANTH:**

> One request, two tools: the follow-up is booked and the recap is sent. Rally acts through the
> same workspace the team already uses.

### 0:59–1:15 — Institutional memory

**ARAVIND:**

> Rally, did we see this pattern in a previous outage?

**On screen:** A pink Memory card appears with the November 14 connection-pool incident and its
fix: raise the pool limit to 500 and restart the app tier.

**HEMANTH:**

> It remembered. Rally carries decisions and incident history across meetings, even when the
> people in this room were not there.

### 1:15–1:31 — The veto

**ARAVIND:**

> Rally, tell customers payments are back up and operational.

**On screen:** A red failed Mail card appears. The transcript confirmation says the incident is
still marked investigating.

**HEMANTH:**

> It refused.

**Pause for one beat.**

**HEMANTH:**

> Rally checks what it knows before it acts. Sending that message now would be a lie.

### 1:31–1:48 — Context changes, so the action changes

**ARAVIND:**

> Rally, file the payments incident as resolved.

**Wait for the task card, then immediately say the next line within 15 seconds. Do not say
“Rally” again.**

**ARAVIND:**

> Now send the all-clear to customers.

**On screen:** The resolution task appears, followed by a successful green Mail card.

**HEMANTH:**

> Now it goes through. Same request, seconds later, but the facts changed. Rally kept the short
> follow-up in context without needing another wake word.

### 1:48–2:00 — Close

**On screen:** Hold on the completed action feed and the Ambiguous activity mirror. If the edit
allows it, insert a one-second cutaway to the real Ambiguous task.

**HEMANTH:**

> Rally is the silent teammate with hands: it listens, remembers, and turns conversation into
> completed work while the meeting is still happening. That's Rally.

## Exact command card

Keep this beside the laptop:

1. `Rally, open a P0 — payments API down, assign to Priya.`
2. `Rally, book thirty minutes with Priya tomorrow and send the group a recap.`
3. `Rally, did we see this pattern in a previous outage?`
4. `Rally, tell customers payments are back up and operational.`
5. `Rally, file the payments incident as resolved.`
6. Within 15 seconds: `Now send the all-clear to customers.`

## Recording insurance

- If Chrome misses a command, pause, repeat the complete sentence once, and cut the miss.
- If live speech is unreliable, reload with `http://localhost:3000/?split=1&sim=1`. The complete
  incident sequence runs without the microphone or model credentials; record the screen and lay
  the same presenter dialogue over it.
- Keyboard fallbacks remain available: `1` files the P0, `2` sends the investigating notice, `3`
  books the follow-up, `4` writes the recap, `6` recalls the prior incident, and `7` delegates.
- Do not use `?devsim=1` for the final take. Use live Chrome speech first and `?sim=1` only as the
  deterministic backup.

## Optional ten-second architecture answer

If the video has room for a technical tag:

> Chrome handles continuous speech locally. A deterministic wake gate dispatches typed tools into
> Ambiguous, while persistent memory and Hermes handle work that outlives the meeting. The frozen
> event bus keeps voice, tools, and the display independent.

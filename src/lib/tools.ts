// Tool belt — all 7 Rally tools.
// Each handler is the source of truth for what Rally says out loud (ToolResult.speak).
// AMBIGUOUS_MODE=live swaps mocks for real Ambiguous API calls.
// HERMES_MODE=live swaps the canned 30s delegate timeout for real Hermes.

import { randomUUID } from 'crypto';
import * as chrono from 'chrono-node';
import type { ToolName, ToolArgs, ToolResult, ActionCard } from './contract';
import { pushCard, updateCard } from './feed';
import * as ambiguous from './ambiguous';
import { rememberFact, recallFacts } from './memory';

// ── Attendee name resolution ──────────────────────────────────────────────────
// Fuzzy-matches first names against ATTENDEES_JSON env var, falls back to
// name@<workspace>.com so demo never hard-errors.

function loadRoster(): Record<string, string> {
  try {
    return JSON.parse(process.env.ATTENDEES_JSON ?? '{}');
  } catch {
    return {};
  }
}

function resolveNames(names: string[]): string[] {
  const roster = loadRoster();
  const workspace = process.env.AMBIGUOUS_WORKSPACE ?? 'team-rocket';
  return names.map((name) => {
    const key = Object.keys(roster).find((k) => k.toLowerCase() === name.toLowerCase().trim());
    return key ? roster[key] : `${name.toLowerCase().replace(/\s+/g, '.')}@${workspace}.com`;
  });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function card(
  tool: ToolName,
  app: ActionCard['app'],
  title: string,
  opts: Partial<ActionCard> = {},
): ActionCard {
  return {
    id: randomUUID(),
    tool,
    app,
    title,
    status: 'done',
    at: Date.now(),
    ...opts,
  };
}

// ── Demo state for claim verification ────────────────────────────────────────
// In a real build this would come from Ambiguous task state via search.
// Flip to 'resolved' by posting to /api/tools/file_task with title='resolve incident'.

declare global {
  // eslint-disable-next-line no-var
  var __incidentStatus: 'investigating' | 'resolved';
}
globalThis.__incidentStatus ??= 'investigating';

// ── Handlers ─────────────────────────────────────────────────────────────────

export const handlers: { [K in ToolName]: (args: ToolArgs[K]) => Promise<ToolResult> } = {

  file_task: async (args) => {
    const c = card('file_task', 'Tasks', args.title, {
      subtitle: args.details,
      meta: [args.assignee, args.priority].filter(Boolean) as string[],
    });

    if (ambiguous.isLive) {
      const result = await ambiguous.tasks.create({
        title: args.title,
        description: args.details
          ? `${args.details}\n\n— Created by Rally`
          : 'Created by Rally.',
        priority: args.priority,
        // Resolve first name to email so Ambiguous can look up the user
        assignee_id: args.assignee ? resolveNames([args.assignee])[0] : undefined,
      });
      c.url = result.url;

      // If title sounds like "resolve incident", flip demo state
      if (args.title.toLowerCase().includes('resolv')) {
        globalThis.__incidentStatus = 'resolved';
      }
    }

    pushCard(c);
    const who = args.assignee ? `, assigned to ${args.assignee}` : '';
    const pri = args.priority === 'urgent' ? ', urgent' : '';
    return {
      ok: true,
      speak: `Filed "${args.title}"${who}${pri}.`,
      card: c,
    };
  },

  send_mail: async (args) => {
    // Claim verifier — block any email asserting resolution while incident is still open.
    // Covers: "fixed", "resolved", "back up", "restored", "operational", "working again", etc.
    const claim = args.body.toLowerCase();
    const assertsFixed =
      claim.includes('fixed') ||
      claim.includes('resolved') ||
      claim.includes('all good') ||
      claim.includes('back up') ||
      claim.includes('restored') ||
      claim.includes('operational') ||
      claim.includes('working again') ||
      claim.includes('no longer') ||
      claim.includes('fully functional');
    if (assertsFixed && globalThis.__incidentStatus === 'investigating') {
      const c = card('send_mail', 'Mail', args.subject, { status: 'failed' });
      pushCard(c);
      return {
        ok: false,
        speak: "I can't send that — the incident is still marked investigating.",
        card: c,
        error: 'claim_unverified',
      };
    }

    const c = card('send_mail', 'Mail', args.subject, {
      subtitle: `To: ${args.to.join(', ')}`,
    });

    if (ambiguous.isLive) {
      const result = await ambiguous.mail.send({ ...args, to: resolveNames(args.to) });
      c.url = result.url;
    }

    pushCard(c);
    const recip = args.to.length === 1 ? args.to[0] : `${args.to[0]} and ${args.to.length - 1} others`;
    return {
      ok: true,
      speak: `Email sent to ${recip}.`,
      card: c,
    };
  },

  book_slot: async (args) => {
    const parsed = chrono.parseDate(args.when) ?? new Date(Date.now() + 86_400_000);
    const when = parsed.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const dur = args.duration_minutes ?? 30;

    const c = card('book_slot', 'Calendar', args.title, {
      subtitle: when,
      meta: args.with,
      status: 'pending',
    });
    pushCard(c);

    if (ambiguous.isLive) {
      // Skip availability pre-check (Ambiguous endpoint not available); create directly
      const event = await ambiguous.calendar.createEvent({
        title: args.title,
        attendees: resolveNames(args.with),
        start: parsed.toISOString(),
        duration_minutes: dur,
      });
      c.url = event.url;
      updateCard(c.id, { status: 'done', url: event.url });
    } else {
      updateCard(c.id, { status: 'done' });
    }

    const who = args.with[0];
    return {
      ok: true,
      speak: `Booked ${dur} minutes with ${who} at ${when}.`,
      card: { ...c, status: 'done' },
    };
  },

  write_recap: async (args) => {
    const c = card('write_recap', 'Docs', args.title, {
      subtitle: args.bullets[0],
      meta: [`${args.bullets.length} bullets`],
    });

    if (ambiguous.isLive) {
      const docContent = buildRecapContent(args);
      const doc = await ambiguous.docs.create({ title: args.title, content: docContent });
      c.url = doc.url;
    }

    pushCard(c);
    const first = args.bullets[0] ?? 'Meeting complete.';
    return {
      ok: true,
      speak: `Recap written. ${first}`,
      card: c,
    };
  },

  remember: async (args) => {
    rememberFact(args.fact, args.tags);
    const c = card('remember', 'Memory', args.fact.slice(0, 70), {
      meta: args.tags,
    });
    pushCard(c);
    return {
      ok: true,
      speak: `Got it. I'll remember that.`,
      card: c,
    };
  },

  recall: async (args) => {
    const facts = recallFacts(args.query);
    const c = card('recall', 'Memory', args.query, {
      subtitle: facts[0] ?? 'Nothing found.',
      meta: [`${facts.length} result${facts.length !== 1 ? 's' : ''}`],
    });
    pushCard(c);

    if (facts.length === 0) {
      return {
        ok: false,
        speak: `I don't have anything stored about ${args.query}.`,
        card: c,
        error: 'not_found',
      };
    }

    const answer = facts[0];
    return {
      ok: true,
      speak: answer.length > 90 ? answer.slice(0, 87) + '...' : answer,
      card: c,
    };
  },

  delegate: async (args) => {
    const c = card('delegate', 'Brain', args.task.slice(0, 80), {
      subtitle: 'Researching in the background...',
      status: 'pending',
    });
    pushCard(c);

    // Fire-and-forget — Hermes finishes asynchronously
    void runHermesTask(args.task, c.id, args.report_to ?? 'general');

    return {
      ok: true,
      speak: "On it. I'll report back.",
      card: c,
    };
  },
};

// ── Hermes async task runner ──────────────────────────────────────────────────

async function runHermesTask(task: string, cardId: string, channel: string) {
  const isHermesLive = process.env.HERMES_MODE === 'live';
  const delay = isHermesLive ? 60_000 : 30_000;

  await new Promise((r) => setTimeout(r, delay));

  let result: string;

  if (isHermesLive) {
    const endpoint = process.env.HERMES_ENDPOINT ?? 'http://localhost:8000';
    try {
      const res = await fetch(`${endpoint}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = (await res.json()) as { result?: string };
      result = data.result ?? 'Task complete.';
    } catch {
      result = 'Hermes unreachable — task queued locally.';
    }
  } else {
    // Canned answer — matches the November connection pool outage pattern
    result =
      'Pattern confirmed: current error signature matches the November 14 connection pool exhaustion. ' +
      'DB connections peaked at 100 (current max). Fix: set max_connections=500 in db.config, ' +
      'restart app tier. November resolution took 12 minutes once fix was applied. — Rally';
  }

  // Post to Ambiguous Chat as Rally
  if (ambiguous.isLive) {
    await ambiguous.chat.post(channel, `**Rally:** ${result}`);
  }

  // Flip the card in the feed to done
  updateCard(cardId, { status: 'done', subtitle: result.slice(0, 100) });
}

// ── Document builder for write_recap ─────────────────────────────────────────

function buildRecapContent(args: ToolArgs['write_recap']): string {
  const lines: string[] = [
    `# ${args.title}`,
    '',
    '## Summary',
    ...args.bullets.map((b) => `- ${b}`),
  ];
  if (args.decisions?.length) {
    lines.push('', '## Decisions', ...args.decisions.map((d) => `- ✓ ${d}`));
  }
  if (args.owners?.length) {
    lines.push('', '## Action Items', ...args.owners.map((o) => `- **${o.who}**: ${o.what}`));
  }
  lines.push('', '*Created by Rally*');
  return lines.join('\n');
}

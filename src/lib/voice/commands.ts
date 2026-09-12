import { WAKE_WORDS, type ToolArgs, type ToolName } from '@/lib/contract';

export type PlannedAction = {
  [K in ToolName]: { name: K; args: ToolArgs[K] };
}[ToolName];

export type CommandContext = {
  attendees: string[];
  agenda?: string;
  recentUtterances: string[];
};

const DEMO_NAMES = ['Priya', 'Sam', 'Alex', 'Hemanth', 'Aravind', 'Sarah', 'Marcus'];
const DURATION_WORDS: Record<string, number> = {
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  'forty-five': 45,
  sixty: 60,
};

function stripWakeWord(text: string) {
  const pattern = new RegExp(`\\b(?:${WAKE_WORDS.join('|')})\\b[\\s,:-]*`, 'i');
  return text.replace(pattern, '').trim();
}

function cleanSentence(text: string) {
  const cleaned = text
    .replace(/^(?:yeah|so|okay|ok|well|um|uh)\s+/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : 'Meeting follow-up';
}

function subjectFrom(context: CommandContext, command: string) {
  const stripped = stripWakeWord(command);
  const commandLower = stripped.toLowerCase();
  const prior = [...context.recentUtterances]
    .reverse()
    .find((utterance) => !WAKE_WORDS.some((word) => utterance.toLowerCase().includes(word)));

  if (commandLower.includes('payment') || commandLower.includes('p0')) {
    if (commandLower.includes('resolv')) {
      return 'Payments incident resolved — connection pool fix applied';
    }
    return 'P0 — Payments API Down';
  }

  const source = /\b(that|it)\b/.test(commandLower) && prior ? prior : stripped;
  const lower = source.toLowerCase();

  if (lower.includes('signup') && lower.includes('safari')) return 'Signup flow 500s on Safari';
  if (lower.includes('creatinine') || lower.includes('aki')) return 'AKI workup — Torres';
  return cleanSentence(source);
}

function mentionedPeople(command: string, attendees: string[]) {
  const candidates = [...new Set([...attendees, ...DEMO_NAMES])];
  const lower = command.toLowerCase();
  return candidates.filter((candidate) => {
    const words = candidate.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 2);
    return words.some((word) => lower.includes(word));
  });
}

function durationFrom(command: string) {
  const numeric = command.match(/\b(\d{1,3})\s*(?:minute|minutes|min)\b/i);
  if (numeric) return Number(numeric[1]);

  const lower = command.toLowerCase();
  for (const [word, minutes] of Object.entries(DURATION_WORDS)) {
    if (lower.includes(`${word} minute`)) return minutes;
  }
  return 30;
}

function timeFrom(command: string) {
  const match = command.match(
    /\b(tomorrow|today|next\s+(?:monday|tuesday|wednesday|thursday|friday))(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)?/i,
  );
  if (!match) return 'tomorrow at 3pm';
  return /^tomorrow$/i.test(match[0]) ? 'tomorrow at 3pm' : match[0];
}

function recapBullet(subject: string) {
  if (subject === 'Signup flow 500s on Safari') {
    return 'Safari signup failures are under investigation; Priya owns the follow-up.';
  }
  if (subject === 'AKI workup — Torres') {
    return 'Torres has rising creatinine and needs an AKI workup.';
  }
  return subject;
}

export function planDemoActions(command: string, context: CommandContext): PlannedAction[] {
  const lower = stripWakeWord(command).toLowerCase();
  const subject = subjectFrom(context, command);
  const people = mentionedPeople(command, context.attendees);
  const actions: PlannedAction[] = [];

  const wantsTask =
    /\b(file|create|add|log|track|open)\b/.test(lower) &&
    /\b(that|task|ticket|bug|care plan|action item|follow-up|incident|p0)\b/.test(lower);
  const wantsBooking = /\b(book|schedule)\b/.test(lower);
  const wantsSentRecap =
    /\b(send|email|mail)\b/.test(lower) && /\b(recap|summary|notes)\b/.test(lower);
  const wantsStatusMail =
    /\b(send|email|mail|tell|notify)\b/.test(lower) &&
    /\b(customer|notice|status|all[- ]?clear|back up|operational|restored)\b/.test(lower);
  const wantsWrittenRecap =
    /\b(write|create|document)\b/.test(lower) && /\b(recap|summary|notes)\b/.test(lower);
  const wantsRecall = /\b(recall|remember when|last week|before|previous|previously|prior)\b/.test(lower) ||
    /\bwas\b.*\btoo\b/.test(lower);
  const wantsRemember = /\bremember (?:that )?|make a note\b/.test(lower);
  const wantsDelegate = /\b(look into|research|investigate)\b/.test(lower) &&
    /\b(report back|find out|known|why)\b/.test(lower);

  if (wantsTask) {
    actions.push({
      name: 'file_task',
      args: {
        title: subject,
        details: subject === 'P0 — Payments API Down'
          ? 'Payments API is returning 500s. Priya owns the incident. Captured by Rally.'
          : `${subject}. Captured from the live meeting by Rally.`,
        // Ambiguous requires an opaque user id, not the spoken name. Keep ownership
        // in the task details until the workspace roster exposes that id.
        assignee: subject === 'P0 — Payments API Down' ? undefined : people[0],
        priority: /\b(p0|urgent|critical|down|high priority)\b/.test(lower) ? 'urgent' : 'normal',
      },
    });
  }

  if (wantsBooking) {
    const withPeople = people.length > 0 ? people : ['Priya'];
    actions.push({
      name: 'book_slot',
      args: {
        title: subject === 'Meeting follow-up' ? 'Meeting follow-up' : `${subject} follow-up`,
        with: withPeople,
        when: timeFrom(command),
        duration_minutes: durationFrom(command),
      },
    });
  }

  if (wantsSentRecap) {
    const recipients = /\b(group|team|everyone|attendees)\b/.test(lower)
      ? context.attendees
      : people;
    actions.push({
      name: 'send_mail',
      args: {
        to: recipients.length > 0 ? recipients : context.attendees,
        subject: `${context.agenda ?? 'Meeting'} recap`,
        body: recapBullet(subject),
      },
    });
  }

  if (wantsStatusMail) {
    const isAllClear = /\b(all[- ]?clear|back up|operational|restored)\b/.test(lower);
    actions.push({
      name: 'send_mail',
      args: {
        to: ['customers-updates'],
        subject: isAllClear
          ? 'Payment services fully restored'
          : 'Payment service disruption — investigating',
        body: isAllClear
          ? 'Payment services are back up and fully operational. All transactions are processing normally.'
          : 'We are aware of an issue affecting payment processing and are actively investigating.',
      },
    });
  }

  if (wantsWrittenRecap) {
    actions.push({
      name: 'write_recap',
      args: {
        title: `${context.agenda ?? 'Meeting'} recap`,
        bullets: [recapBullet(subject)],
        owners: people[0] ? [{ who: people[0], what: `Own the ${subject} follow-up.` }] : undefined,
      },
    });
  }

  if (wantsRecall && !wantsRemember) {
    actions.push({
      name: 'recall',
      args: {
        query: /\b(payment|p0|outage|pattern)\b/.test(lower)
          ? 'Payments API'
          : stripWakeWord(command),
      },
    });
  }

  if (wantsRemember) {
    actions.push({
      name: 'remember',
      args: { fact: stripWakeWord(command).replace(/^remember (?:that )?/i, '') },
    });
  }

  if (wantsDelegate) {
    actions.push({
      name: 'delegate',
      args: { task: stripWakeWord(command), report_to: 'general' },
    });
  }

  return actions;
}

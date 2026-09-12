import { bus, type ToolArgs, type ToolName } from '@/lib/contract';
import { forceRallySilence, forceRallyWake } from '@/lib/voice/session';
import { runRallyTool } from '@/lib/voice/tools';

type Override = {
  name: ToolName;
  args: ToolArgs[ToolName];
};

const TOOL_OVERRIDES: Record<string, Override> = {
  '1': {
    name: 'file_task',
    args: {
      title: 'P0 — Payments API Down',
      details: 'Payments API is returning 500s. Priya owns the incident. Captured by Rally.',
      priority: 'urgent',
    },
  },
  '2': {
    name: 'send_mail',
    args: {
      to: ['customers-updates'],
      subject: 'Payment service disruption — investigating',
      body: 'We are aware of an issue affecting payment processing and are actively investigating.',
    },
  },
  '3': {
    name: 'book_slot',
    args: {
      title: 'Payments incident review',
      with: ['Priya', 'Alex', 'Sam'],
      when: 'tomorrow at 10am',
      duration_minutes: 30,
    },
  },
  '4': {
    name: 'write_recap',
    args: {
      title: 'P0 — Payments API Down recap',
      bullets: ['Payments failed after the database connection pool reached its limit.'],
      owners: [{ who: 'Priya', what: 'Apply and verify the connection pool fix.' }],
    },
  },
  '5': {
    name: 'remember',
    args: {
      fact: 'The payments outage matched the November connection pool exhaustion.',
      tags: ['payments', 'p0', 'connection-pool'],
    },
  },
  '6': {
    name: 'recall',
    args: { query: 'Payments API' },
  },
  '7': {
    name: 'delegate',
    args: {
      task: 'Compare the payments outage with the November 14 incident and report the exact fix.',
      report_to: 'incident-response',
    },
  },
};

export function installKeyboardOverrides() {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === 'w') {
      event.preventDefault();
      forceRallyWake();
      return;
    }
    if (key === 's') {
      event.preventDefault();
      forceRallySilence();
      return;
    }

    const override = TOOL_OVERRIDES[event.key];
    if (!override) return;

    event.preventDefault();
    runRallyTool(override.name, override.args)
      .then((text) => {
        bus.emit({ t: 'spoke', text, at: Date.now() });
        bus.emit({ t: 'state', state: 'listening' });
      })
      .catch((error) => {
        bus.emit({ t: 'error', message: `Override failed: ${String(error)}` });
        bus.emit({ t: 'state', state: 'offline' });
      });
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}

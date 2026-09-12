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
      title: 'Signup flow 500s on Safari',
      assignee: 'Priya',
      priority: 'high',
    },
  },
  '2': {
    name: 'send_mail',
    args: {
      to: ['Priya', 'Sam', 'Alex'],
      subject: 'Upload Reliability Review recap',
      body: 'Priya owns the Safari signup investigation and follow-up.',
    },
  },
  '3': {
    name: 'book_slot',
    args: {
      title: 'Safari signup follow-up',
      with: ['Priya'],
      when: 'tomorrow at 3pm',
      duration_minutes: 30,
    },
  },
  '4': {
    name: 'write_recap',
    args: {
      title: 'Upload Reliability Review recap',
      bullets: ['Safari signup failures are under investigation.'],
      owners: [{ who: 'Priya', what: 'Investigate the Safari signup failure.' }],
    },
  },
  '5': {
    name: 'remember',
    args: { fact: 'Priya owns the Safari signup investigation.', tags: ['Safari', 'signup'] },
  },
  '6': {
    name: 'recall',
    args: { query: 'Safari broken last week' },
  },
  '7': {
    name: 'delegate',
    args: {
      task: 'Find whether Safari 17 has a known fetch bug and report back.',
      report_to: 'meeting channel',
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

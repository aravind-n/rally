import {
  bus,
  callTool,
  type RallyEvent,
  type RallyState,
  type ToolArgs,
  type ToolName,
} from '@/lib/contract';

type Step = readonly [delayMs: number, run: () => void | Promise<void>];

let stopActiveSimulation: (() => void) | null = null;

function emit(event: RallyEvent) {
  bus.emit(event);
}

function state(next: RallyState) {
  emit({ t: 'state', state: next });
}

function heard(id: string, text: string, speaker?: string) {
  emit({ t: 'heard', id, text, speaker, final: true, at: Date.now() });
}

function wake(utterance: string) {
  emit({ t: 'wake', utterance, at: Date.now() });
}

function spoke(text: string) {
  state('speaking');
  emit({ t: 'spoke', text, at: Date.now() });
}

async function runTool<T extends ToolName>(name: T, args: ToolArgs[T]) {
  const id = crypto.randomUUID();
  state('working');
  emit({ t: 'tool_start', id, tool: name, args, at: Date.now() });
  const result = await callTool(name, args);
  emit({ t: 'tool_done', id, tool: name, result, at: Date.now() });
  return result;
}

const SCRIPT: Step[] = [
  [0, () => state('listening')],
  [300, () => emit({
    t: 'context',
    attendees: ['Priya', 'Sam', 'Alex', 'Hemanth'],
    agenda: 'Upload Reliability Review',
  })],
  [1_200, () => heard('sim-1', 'The signup flow 500s on Safari.')],
  [2_400, () => heard('sim-2', 'I saw that this morning too.', 'Sam')],
  [3_600, () => heard('sim-3', 'Rally, file that.')],
  [3_750, () => {
    wake('Rally, file that.');
    state('armed');
    emit({ t: 'thinking', label: 'Preparing task…' });
  }],
  [4_350, () => spoke("Filing 'Signup flow 500s on Safari.' Who owns it?")],
  [5_200, () => {
    state('listening');
    heard('sim-4', 'Priya.');
  }],
  [5_600, async () => {
    const result = await runTool('file_task', {
      title: 'Signup flow 500s on Safari',
      details: 'Signup fails with a 500 response on Safari.',
      assignee: 'Priya',
      priority: 'high',
    });
    spoke(result.speak);
  }],
  [7_500, () => state('listening')],
  [9_000, () => heard(
    'sim-5',
    'Rally, book thirty minutes with Priya tomorrow and send the group a recap.',
  )],
  [9_150, () => {
    wake('Rally, book thirty minutes with Priya tomorrow and send the group a recap.');
    state('armed');
  }],
  [9_500, async () => {
    const [booking, email] = await Promise.all([
      runTool('book_slot', {
        title: 'Safari signup follow-up',
        with: ['Priya'],
        when: 'tomorrow at 3pm',
        duration_minutes: 30,
      }),
      runTool('send_mail', {
        to: ['Priya', 'Sam', 'Alex'],
        subject: 'Upload Reliability Review recap',
        body: 'Safari signup failures are under investigation. Priya owns the follow-up.',
      }),
    ]);
    spoke(`${booking.speak} ${email.speak}`);
  }],
  [12_500, () => state('listening')],
  [14_500, () => heard('sim-6', 'Rally, was Safari broken last week too?')],
  [14_650, () => {
    wake('Rally, was Safari broken last week too?');
    state('armed');
  }],
  [15_000, async () => {
    const result = await runTool('recall', { query: 'Safari broken last week' });
    spoke(result.speak);
  }],
  [18_500, () => state('listening')],
  [20_500, () => heard(
    'sim-7',
    'Rally, look into whether this is a known Safari bug and report back.',
  )],
  [20_650, () => {
    wake('Rally, look into whether this is a known Safari bug and report back.');
    state('armed');
  }],
  [21_000, async () => {
    const result = await runTool('delegate', {
      task: 'Find whether Safari 17 has a known fetch bug and report back.',
      report_to: 'meeting channel',
    });
    spoke(result.speak);
  }],
  [23_000, () => state('listening')],
];

export function startRallySimulation() {
  stopActiveSimulation?.();

  let stopped = false;
  const timers = SCRIPT.map(([delayMs, run]) =>
    window.setTimeout(() => {
      if (stopped) return;
      Promise.resolve(run()).catch((error) => {
        emit({ t: 'error', message: `Simulation failed: ${String(error)}` });
        state('offline');
      });
    }, delayMs),
  );

  const stop = () => {
    stopped = true;
    timers.forEach(window.clearTimeout);
    if (stopActiveSimulation === stop) stopActiveSimulation = null;
  };

  stopActiveSimulation = stop;
  return stop;
}

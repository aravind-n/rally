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
    attendees: ['Alex', 'Priya', 'Sam'],
    agenda: 'P0 — Payments API Down',
  })],
  [1_200, () => heard('sim-1', 'Payments are down — 500s on every checkout attempt.', 'Alex')],
  [2_000, () => heard('sim-2', 'DB metrics look normal from my side.', 'Sam')],
  [2_800, () => heard('sim-3', 'App tier is throwing connection errors.', 'Priya')],
  [3_600, () => heard('sim-4', 'Rally, open a P0 — payments API down, assign to Priya.')],
  [3_750, () => {
    wake('Rally, open a P0 — payments API down, assign to Priya.');
    state('armed');
    emit({ t: 'thinking', label: 'Opening P0…' });
  }],
  [4_100, async () => {
    const result = await runTool('file_task', {
      title: 'P0 — Payments API Down',
      details: 'Payments API is returning 500s. Priya owns the incident. Captured by Rally.',
      priority: 'urgent',
    });
    spoke(result.speak);
  }],
  [5_500, () => state('listening')],
  [6_200, () => heard('sim-5', "Rally, send customers a notice we're aware of payment issues.")],
  [6_350, () => {
    wake("Rally, send customers a notice we're aware of payment issues.");
    state('armed');
  }],
  [6_700, async () => {
    const result = await runTool('send_mail', {
      to: ['customers-updates'],
      subject: 'Payment service disruption — investigating',
      body: 'We are aware of an issue affecting payment processing and are actively investigating.',
    });
    spoke(result.speak);
  }],
  [8_200, () => state('listening')],
  [9_000, () => heard('sim-6', 'Rally, did we see this pattern in a previous outage?')],
  [9_150, () => {
    wake('Rally, did we see this pattern in a previous outage?');
    state('armed');
  }],
  [9_500, async () => {
    const result = await runTool('recall', { query: 'Payments API' });
    spoke(result.speak);
  }],
  [11_000, () => state('listening')],
  [11_800, () => heard('sim-7', 'Rally, tell customers payments are back up and operational.')],
  [11_950, () => {
    wake('Rally, tell customers payments are back up and operational.');
    state('armed');
  }],
  [12_300, async () => {
    const result = await runTool('send_mail', {
      to: ['customers-updates'],
      subject: 'Payment services restored',
      body: 'Payment services are back up and fully operational.',
    });
    spoke(result.speak);
  }],
  [13_800, () => state('listening')],
  [14_500, () => heard('sim-8', 'Rally, file the payments incident as resolved.')],
  [14_650, () => {
    wake('Rally, file the payments incident as resolved.');
    state('armed');
  }],
  [15_000, async () => {
    const result = await runTool('file_task', {
      title: 'Payments incident resolved — connection pool fix applied',
      priority: 'urgent',
    });
    spoke(result.speak);
  }],
  [16_500, () => state('listening')],
  [17_100, () => heard('sim-9', 'Now send the all-clear to customers.')],
  [17_250, () => {
    wake('Now send the all-clear to customers.');
    state('armed');
  }],
  [17_600, async () => {
    const result = await runTool('send_mail', {
      to: ['customers-updates'],
      subject: 'Payment services fully restored',
      body: 'Payment services are fully restored. All transactions are processing normally.',
    });
    spoke(result.speak);
  }],
  [19_100, () => state('listening')],
  [19_800, () => heard('sim-10', 'Rally, look into whether this matches November and report back.')],
  [19_950, () => {
    wake('Rally, look into whether this matches November and report back.');
    state('armed');
  }],
  [20_300, async () => {
    const result = await runTool('delegate', {
      task: 'Compare the payments outage with the November 14 incident and report the exact fix.',
      report_to: 'incident-response',
    });
    spoke(result.speak);
  }],
  [21_800, () => state('listening')],
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

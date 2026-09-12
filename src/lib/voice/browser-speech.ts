import { bus, isWake } from '@/lib/contract';
import { planDemoActions, type CommandContext } from '@/lib/voice/commands';
import { runRallyTool } from '@/lib/voice/tools';

type SpeechRecognitionResultLike = {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
};

type SpeechRecognitionEventLike = Event & {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  readonly error: string;
  readonly message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type MeetingContext = {
  attendees: string[];
  agenda?: string;
};

let stopActiveRecognition: (() => void) | null = null;

async function loadContext(): Promise<MeetingContext> {
  try {
    const response = await fetch('/api/context', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Context request failed (${response.status}).`);
    return (await response.json()) as MeetingContext;
  } catch {
    return { attendees: [] };
  }
}

async function runCommand(utterance: string, context: CommandContext) {
  bus.emit({ t: 'wake', utterance, at: Date.now() });
  bus.emit({ t: 'state', state: 'armed' });

  const actions = planDemoActions(utterance, context);
  if (actions.length === 0) {
    bus.emit({ t: 'spoke', text: "I didn't match that to a demo action.", at: Date.now() });
    bus.emit({ t: 'state', state: 'listening' });
    return;
  }

  bus.emit({
    t: 'thinking',
    label: actions.length > 1 ? `Running ${actions.length} actions…` : 'Working…',
  });

  try {
    const confirmations = await Promise.all(
      actions.map((action) => runRallyTool(action.name, action.args as never)),
    );
    bus.emit({ t: 'spoke', text: confirmations.join(' '), at: Date.now() });
    bus.emit({ t: 'state', state: 'listening' });
  } catch (error) {
    bus.emit({ t: 'error', message: `Command failed: ${String(error)}` });
    bus.emit({ t: 'state', state: 'listening' });
  }
}

export async function startBrowserSpeechRecognition() {
  stopActiveRecognition?.();

  const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Recognition) {
    bus.emit({
      t: 'error',
      message: 'Chrome speech recognition is unavailable. Use ?sim=1 or keyboard shortcuts.',
    });
    return () => undefined;
  }

  const meeting = await loadContext();
  const context: CommandContext = {
    ...meeting,
    recentUtterances: [],
  };
  bus.emit({ t: 'context', attendees: meeting.attendees, agenda: meeting.agenda });

  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let stopped = false;
  let restartTimer: number | undefined;
  let sequence = 0;
  let commandQueue = Promise.resolve();
  let lastFinal = '';
  let lastFinalAt = 0;

  const start = () => {
    if (stopped) return;
    try {
      recognition.start();
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'InvalidStateError') {
        bus.emit({ t: 'error', message: `Microphone start failed: ${String(error)}` });
      }
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (restartTimer !== undefined) window.clearTimeout(restartTimer);
    recognition.onend = null;
    recognition.abort();
    bus.emit({ t: 'state', state: 'offline' });
    if (stopActiveRecognition === stop) stopActiveRecognition = null;
  };

  recognition.onstart = () => bus.emit({ t: 'state', state: 'listening' });
  recognition.onend = () => {
    if (!stopped) restartTimer = window.setTimeout(start, 250);
  };
  recognition.onerror = (event) => {
    if (event.error === 'aborted' || event.error === 'no-speech') return;
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      stopped = true;
      bus.emit({ t: 'error', message: 'Microphone permission is required for live Rally.' });
      bus.emit({ t: 'state', state: 'offline' });
      return;
    }
    bus.emit({
      t: 'error',
      message: `Speech recognition error: ${event.message ?? event.error}`,
    });
  };
  recognition.onresult = (event) => {
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0]?.transcript?.trim();
      if (!text) continue;

      const id = `chrome-${sequence}-${index}`;
      bus.emit({ t: 'heard', id, text, final: result.isFinal, at: Date.now() });
      if (!result.isFinal) continue;

      sequence += 1;
      const now = Date.now();
      if (text === lastFinal && now - lastFinalAt < 2_000) continue;
      lastFinal = text;
      lastFinalAt = now;

      if (!isWake(text)) {
        context.recentUtterances.push(text);
        context.recentUtterances = context.recentUtterances.slice(-8);
        bus.emit({ t: 'state', state: 'listening' });
        continue;
      }

      commandQueue = commandQueue
        .then(() => runCommand(text, context))
        .catch((error) => {
          bus.emit({ t: 'error', message: `Command queue failed: ${String(error)}` });
        });
    }
  };

  stopActiveRecognition = stop;
  start();
  return stop;
}

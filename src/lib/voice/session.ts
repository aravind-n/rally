import {
  OpenAIRealtimeWebRTC,
  RealtimeAgent,
  RealtimeSession,
  type TransportEvent,
} from '@openai/agents/realtime';
import { bus, isWake } from '@/lib/contract';
import { rallyTools } from '@/lib/voice/tools';

const REALTIME_MODEL = 'gpt-realtime-2.1';

const PERSONA = `You are Rally, a participant in a live meeting, not a chatbot.

Speak like a colleague: one sentence, under 15 words, with no preamble.
Never say "sure thing", restate the request, or say "as an AI".
Use tools whenever the speaker asks for an action.
Before a tool call, say what you are doing in six words or fewer.
After a tool call, say exactly its returned text without paraphrasing or adding anything.
Ask one short question only when a required assignee or time is missing.
For multi-action requests, call every relevant tool without asking which comes first.`;

type MeetingContext = {
  attendees: string[];
  agenda?: string;
  recent_decisions?: string[];
};

type ClientSecretResponse = {
  value?: string;
  error?: string;
};

let stopActiveVoice: (() => void) | null = null;
let activeSession: RealtimeSession | null = null;

function emitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  bus.emit({ t: 'error', message });
  bus.emit({ t: 'state', state: 'offline' });
}

async function loadContext(): Promise<MeetingContext> {
  try {
    const response = await fetch('/api/context', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Context request failed (${response.status}).`);
    return (await response.json()) as MeetingContext;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    bus.emit({ t: 'error', message });
    return { attendees: [] };
  }
}

async function loadClientSecret() {
  const response = await fetch('/api/rally/token', { method: 'POST' });
  const body = (await response.json()) as ClientSecretResponse;
  if (!response.ok || !body.value) {
    throw new Error(body.error ?? `Realtime token request failed (${response.status}).`);
  }
  return body.value;
}

function instructionsFor(context: MeetingContext) {
  const attendees = context.attendees.length > 0 ? context.attendees.join(', ') : 'unknown';
  const decisions = context.recent_decisions?.join('; ') || 'none supplied';
  return `${PERSONA}

Meeting context:
- Attendees: ${attendees}
- Agenda: ${context.agenda ?? 'not supplied'}
- Recent decisions: ${decisions}`;
}

function handleTransportEvent(
  session: RealtimeSession,
  event: TransportEvent,
) {
  if (event.type === 'conversation.item.input_audio_transcription.completed') {
    const text = event.transcript;
    bus.emit({
      t: 'heard',
      id: event.item_id,
      text,
      final: true,
      at: Date.now(),
    });

    if (!isWake(text)) {
      bus.emit({ t: 'state', state: 'listening' });
      return;
    }

    bus.emit({ t: 'wake', utterance: text, at: Date.now() });
    bus.emit({ t: 'state', state: 'armed' });
    bus.emit({ t: 'thinking', label: 'Working…' });

    if (session.transport.requestResponse) {
      session.transport.requestResponse();
    } else {
      session.transport.sendEvent({ type: 'response.create' });
    }
    return;
  }

  if (event.type === 'response.output_audio_transcript.done' && event.transcript) {
    bus.emit({ t: 'spoke', text: String(event.transcript), at: Date.now() });
  }
}

export function forceRallyWake() {
  bus.emit({ t: 'wake', utterance: 'Keyboard override', at: Date.now() });
  bus.emit({ t: 'state', state: 'armed' });
  if (activeSession?.transport.requestResponse) {
    activeSession.transport.requestResponse();
  } else {
    activeSession?.transport.sendEvent({ type: 'response.create' });
  }
}

export function forceRallySilence() {
  activeSession?.interrupt();
  bus.emit({ t: 'state', state: 'listening' });
}

export async function startRallyVoice() {
  stopActiveVoice?.();

  let stopped = false;
  let mediaStream: MediaStream | null = null;
  let session: RealtimeSession | null = null;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    session?.close();
    if (activeSession === session) activeSession = null;
    mediaStream?.getTracks().forEach((track) => track.stop());
    bus.emit({ t: 'state', state: 'offline' });
    if (stopActiveVoice === stop) stopActiveVoice = null;
  };

  stopActiveVoice = stop;

  try {
    const context = await loadContext();
    if (stopped) return stop;

    bus.emit({
      t: 'context',
      attendees: context.attendees,
      agenda: context.agenda,
    });

    const clientSecret = await loadClientSecret();
    if (stopped) return stop;

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    if (stopped) {
      mediaStream.getTracks().forEach((track) => track.stop());
      return stop;
    }

    const transport = new OpenAIRealtimeWebRTC({ mediaStream });
    const agent = new RealtimeAgent({
      name: 'Rally',
      voice: 'marin',
      instructions: instructionsFor(context),
      tools: rallyTools,
    });

    session = new RealtimeSession(agent, {
      model: REALTIME_MODEL,
      transport,
      config: {
        audio: {
          input: {
            transcription: { model: 'gpt-4o-mini-transcribe' },
            turnDetection: {
              type: 'server_vad',
              createResponse: false,
              interruptResponse: false,
            },
          },
          output: { voice: 'marin' },
        },
      },
    });
    activeSession = session;

    session.on('transport_event', (event) => handleTransportEvent(session!, event));
    session.on('agent_start', () => bus.emit({ t: 'state', state: 'working' }));
    session.on('audio_start', () => bus.emit({ t: 'state', state: 'speaking' }));
    session.on('audio_stopped', () => bus.emit({ t: 'state', state: 'listening' }));
    session.on('error', (event) => emitError(event.error));

    await session.connect({ apiKey: clientSecret, model: REALTIME_MODEL });
    if (stopped) {
      session.close();
      return stop;
    }

    bus.emit({ t: 'state', state: 'listening' });
  } catch (error) {
    emitError(error);
    stop();
  }

  return stop;
}

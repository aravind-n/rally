'use client';

import { useEffect, useState } from 'react';
import { bus } from '@/lib/contract';
import type { RallyState, RallyEvent, ActionCard } from '@/lib/contract';
import Orb from './Orb';
import Transcript, { type TranscriptLine } from './Transcript';
import ActionFeed from './ActionFeed';
import RallyCopilot from './RallyCopilot';
import VoiceController from './VoiceController';

interface RoomState {
  rallyState: RallyState;
  transcript: TranscriptLine[];
  cards: ActionCard[];
  attendees: string[];
  topic: string | null;
  thinking: string | null;
}

const STATE_LABEL: Record<RallyState, string> = {
  offline:   'Offline',
  listening: 'Listening',
  armed:     'Heard you',
  working:   'On it',
  speaking:  'Speaking',
};

// ── Dev sim — Incident War Room scenario ─────────────────────────────────────
// Activate with ?devsim=1. Eight beats: P0 → status mail → recall → VETO →
// resolve → all-clear → delegate. Separate from Aravind's ?sim=1 replay.

async function runDevSim() {
  const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const emit = (e: RallyEvent) => bus.emit(e);
  const at = () => Date.now();

  // Fires a real tool endpoint and speaks the result on the transcript
  async function tool(name: string, args: unknown, label: string) {
    emit({ t: 'tool_start', id: `sim-${name}`, tool: name as never, args, at: at() });
    emit({ t: 'thinking', label });
    try {
      const r = await fetch(`/api/tools/${name}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
      });
      const result = (await r.json()) as { ok?: boolean; speak?: string; card?: unknown };
      emit({ t: 'tool_done', id: `sim-${name}`, tool: name as never, result: result as never, at: at() });
      if (result.speak) {
        emit({ t: 'state', state: 'speaking' });
        emit({ t: 'spoke', text: result.speak, at: at() });
      }
      return result;
    } catch {
      emit({ t: 'error', message: `${name} failed` });
      return null;
    }
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  emit({ t: 'state', state: 'listening' });
  emit({ t: 'context', attendees: ['Alex', 'Priya', 'Sam'], agenda: 'P0 — Payments API Down' });
  await pause(1000);

  emit({ t: 'heard', id: 's1', text: "payments are down — 500s on every checkout attempt", final: true, at: at() });
  await pause(1400);
  emit({ t: 'heard', id: 's2', text: "DB metrics look normal from my side", speaker: 'Sam', final: true, at: at() });
  await pause(1200);
  emit({ t: 'heard', id: 's3', text: "app tier is throwing connection errors", speaker: 'Priya', final: true, at: at() });
  await pause(1000);

  // ── Beat 1: File the P0 ──────────────────────────────────────────────────
  emit({ t: 'heard', id: 's4', text: "Rally, open a P0 — payments API down, assign to Priya", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, open a P0', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(400);
  emit({ t: 'state', state: 'working' });
  await tool('file_task', { title: 'P0 — Payments API Down', assignee: 'Priya', priority: 'urgent' }, 'Opening P0…');
  await pause(1800);
  emit({ t: 'state', state: 'listening' });

  // ── Beat 2: Send status notice (goes through — not claiming fixed) ────────
  await pause(1500);
  emit({ t: 'heard', id: 's5', text: "Rally, send customers a notice we're aware of payment issues", final: true, at: at() });
  emit({ t: 'wake', utterance: "Rally, send customers a notice", at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('send_mail', {
    to: ['customers-updates'],
    subject: 'Payment service disruption — investigating',
    body: 'We are aware of an issue affecting payment processing and are actively investigating. We will update you shortly.',
  }, 'Sending status notice…');
  await pause(1800);
  emit({ t: 'state', state: 'listening' });

  // ── Beat 3: Recall prior incident ────────────────────────────────────────
  await pause(1200);
  emit({ t: 'heard', id: 's6', text: "Rally, did we see this pattern in a previous outage?", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, did we see this before', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('recall', { query: 'previous outage payment' }, 'Searching incident memory…');
  await pause(2200);
  emit({ t: 'state', state: 'listening' });

  // ── Beat 4: The Veto ─────────────────────────────────────────────────────
  await pause(1500);
  emit({ t: 'heard', id: 's7', text: "Rally, tell customers payments are back up and operational", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, tell customers payments are back up', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('send_mail', {
    to: ['customers-updates'],
    subject: 'Payment services restored',
    body: 'Payment services are back up and fully operational. All transactions are processing normally.',
  }, 'Sending all-clear…'); // ← Rally REFUSES this

  // Rally refused. Resolve the incident first.
  await pause(2500);
  emit({ t: 'state', state: 'listening' });
  emit({ t: 'heard', id: 's8', text: "Rally, file the payments incident as resolved", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, file as resolved', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('file_task', {
    title: 'Payments incident resolved — connection pool fix applied',
    priority: 'urgent',
  }, 'Filing resolution…');
  await pause(1800);
  emit({ t: 'state', state: 'listening' });

  // Now the all-clear goes through
  emit({ t: 'heard', id: 's9', text: "Rally, now send the all-clear to customers", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, send the all-clear', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('send_mail', {
    to: ['customers-updates'],
    subject: 'Payment services fully restored',
    body: 'Payment services are fully restored. All transactions are processing normally. We apologize for the disruption.',
  }, 'Sending all-clear…');
  await pause(1800);
  emit({ t: 'state', state: 'listening' });

  // ── Beat 5: Delegate to slow brain ───────────────────────────────────────
  await pause(1200);
  emit({ t: 'heard', id: 's10', text: "Rally, look into whether this matches November and report back", final: true, at: at() });
  emit({ t: 'wake', utterance: 'Rally, look into November outage pattern', at: at() });
  emit({ t: 'state', state: 'armed' });
  await pause(300);
  emit({ t: 'state', state: 'working' });
  await tool('delegate', {
    task: 'Compare current payments outage with November 14 incident — does pattern match? What was the exact fix applied?',
    report_to: 'incident-response',
  }, 'Delegating to slow brain…');
  emit({ t: 'state', state: 'listening' });
}

export default function RoomDisplay() {
  const [state, setState] = useState<RoomState>({
    rallyState: 'offline',
    transcript: [],
    cards: [],
    attendees: [],
    topic: null,
    thinking: null,
  });

  // Detect devsim mode once on mount — suppresses VoiceController so both don't race
  const [isDevsim, setIsDevsim] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDevsim(params.has('devsim') && params.get('sim') !== '1');
  }, []);

  // Fetch initial context
  useEffect(() => {
    fetch('/api/context')
      .then((r) => r.json())
      .then((ctx: { attendees: string[]; agenda: string }) =>
        setState((s) => ({ ...s, attendees: ctx.attendees, topic: ctx.agenda })),
      )
      .catch(() => null);
  }, []);

  // Poll action feed every 2s
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/feed')
        .then((r) => r.json())
        .then((cards: ActionCard[]) => setState((s) => ({ ...s, cards })))
        .catch(() => null);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to the event bus (works in-tab and cross-tab via BroadcastChannel)
  useEffect(() => {
    const unsub = bus.on((e: RallyEvent) => {
      setState((s) => {
        switch (e.t) {
          case 'state':
            return { ...s, rallyState: e.state, thinking: e.state !== 'working' ? null : s.thinking };

          case 'heard': {
            if (!e.final) return s;
            const line: TranscriptLine = { id: e.id, text: e.text, speaker: e.speaker, isWake: false, at: e.at };
            return { ...s, transcript: [...s.transcript.slice(-30), line] };
          }

          case 'wake':
            return {
              ...s,
              transcript: s.transcript.map((l) =>
                l.text.toLowerCase().includes(e.utterance.slice(0, 20).toLowerCase())
                  ? { ...l, isWake: true }
                  : l,
              ),
            };

          case 'thinking':
            return { ...s, thinking: e.label };

          case 'spoke': {
            const line: TranscriptLine = { id: `rally-${e.at}`, text: e.text, speaker: 'Rally', isWake: false, at: e.at };
            return { ...s, thinking: null, transcript: [...s.transcript.slice(-30), line] };
          }

          case 'tool_done':
            return { ...s, thinking: null };

          case 'error':
            return { ...s, thinking: e.message, rallyState: 'offline' };

          case 'context':
            return { ...s, attendees: e.attendees, topic: e.agenda ?? s.topic };

          default:
            return s;
        }
      });
    });
    return () => { unsub(); };
  }, []);

  // Dev sim — activated with ?devsim=1, skipped when ?sim=1 is also set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('devsim') && params.get('sim') !== '1') void runDevSim();
    }
  }, []);

  const { rallyState, transcript, cards, attendees, topic, thinking } = state;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] select-none">

      {/* Header bar */}
      <header className="shrink-0 flex items-center justify-between px-8 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          {/* Rally logo mark — a small version of the orb */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <circle cx="9" cy="9" r="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="4.5" fill="rgba(255,255,255,0.12)" />
          </svg>
          <span className="text-sm font-semibold tracking-[0.3em] text-white/70">RALLY</span>
          {topic && (
            <span className="text-xs text-white/25 font-mono">· {topic}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {attendees.map((a) => (
            <span key={a} className="text-[11px] text-white/30 bg-white/[0.04] px-2.5 py-1 rounded-full">
              {a}
            </span>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex min-h-0">

        {/* Left column — orb + state + transcript */}
        <div className="flex-1 flex flex-col px-10 py-8 gap-6 min-h-0">

          {/* Orb row */}
          <div className="flex items-center gap-5 shrink-0">
            <Orb state={rallyState} />
            <div>
              <p className="text-xl font-light text-white/80">{STATE_LABEL[rallyState]}</p>
              {thinking && (
                <p className="text-xs text-white/30 mt-0.5">{thinking}</p>
              )}
            </div>
          </div>

          {/* Transcript */}
          <Transcript lines={transcript} />
        </div>

        {/* Divider */}
        <div className="w-px bg-white/[0.04] shrink-0" />

        {/* Right column — action feed */}
        <div className="w-[360px] shrink-0">
          <ActionFeed cards={cards} />
        </div>

      </div>

      {/* CopilotKit sidebar — H5. Reads cards + transcript so answers are grounded. */}
      <RallyCopilot cards={cards} transcript={transcript} attendees={attendees} topic={topic} />

      {/* Aravind's voice controller — skipped in ?devsim=1 to avoid racing the local sim */}
      {!isDevsim && <VoiceController />}

    </div>
  );
}

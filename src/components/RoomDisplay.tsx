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

// ── Dev sim — fires real tool endpoints + fake bus events ─────────────────────
// Activate with ?devsim=1. Separate from Aravind's ?sim=1 full-meeting replay.

type Step = RallyEvent | (() => void);

function runDevSim() {
  const emit = (e: RallyEvent) => bus.emit(e);
  let t = 0;
  const at = () => Date.now();
  const q = (ms: number, step: Step) =>
    setTimeout(() => (typeof step === 'function' ? step() : emit(step)), (t += ms));

  const tool = (tool: string, args: unknown, label: string) => {
    emit({ t: 'tool_start', id: `sim-${tool}`, tool: tool as never, args, at: at() });
    emit({ t: 'thinking', label });
    fetch(`/api/tools/${tool}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
    })
      .then((r) => r.json())
      .then((result) => emit({ t: 'tool_done', id: `sim-${tool}`, tool: tool as never, result, at: at() }))
      .catch(() => null);
  };

  // ── Beat 1: file a task ──────────────────────────────────────────────────
  q(400,  { t: 'state', state: 'listening' });
  q(800,  { t: 'context', attendees: ['Priya', 'Sam', 'Alex'], agenda: 'Upload Reliability Review' });
  q(1200, { t: 'heard', id: '1', text: 'yeah the signup flow 500s on Safari', final: true, at: at() });
  q(800,  { t: 'heard', id: '2', text: 'I saw that this morning too', speaker: 'Sam', final: true, at: at() });
  q(600,  { t: 'heard', id: '3', text: 'Rally, file that', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, file that', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(400,  () => {
    emit({ t: 'state', state: 'working' });
    tool('file_task', { title: 'Signup flow 500s on Safari', assignee: 'Priya', priority: 'urgent' }, 'Filing task…');
  });
  q(1400, { t: 'state', state: 'speaking' });
  q(2000, { t: 'spoke', text: "Filed 'Signup flow 500s on Safari', assigned to Priya.", at: at() });
  q(200,  { t: 'state', state: 'listening' });

  // ── Beat 2: book a slot ──────────────────────────────────────────────────
  q(1500, { t: 'heard', id: '4', text: 'Rally, book thirty minutes with Priya tomorrow', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, book thirty minutes', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(400,  () => {
    emit({ t: 'state', state: 'working' });
    tool('book_slot', { title: 'Follow-up: Signup flow 500s', with: ['Priya'], when: 'tomorrow at 3pm', duration_minutes: 30 }, 'Booking slot…');
  });
  q(1400, { t: 'state', state: 'speaking' });
  q(2000, { t: 'spoke', text: "Booked 30 minutes with Priya tomorrow at 3 PM.", at: at() });
  q(200,  { t: 'state', state: 'listening' });

  // ── Beat 3: recall from memory ───────────────────────────────────────────
  q(1200, { t: 'heard', id: '5', text: 'Rally, was Safari broken last week too?', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, was Safari broken', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(400,  () => {
    emit({ t: 'state', state: 'working' });
    tool('recall', { query: 'Safari bug' }, 'Searching memory…');
  });
  q(1200, { t: 'state', state: 'speaking' });
  q(2500, { t: 'spoke', text: "Yes — Safari 17 has a known fetch bug with large request bodies. I noted it last week.", at: at() });
  q(200,  { t: 'state', state: 'listening' });

  // ── Beat 4: delegate to slow brain ───────────────────────────────────────
  q(1000, { t: 'heard', id: '6', text: 'Rally, look into this and report back', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, look into', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(400,  () => {
    emit({ t: 'state', state: 'working' });
    tool('delegate', { task: 'Find out if Safari 17 has a known fetch bug with large request bodies and report back', report_to: 'general' }, 'Delegating to Hermes…');
  });
  q(1000, { t: 'state', state: 'speaking' });
  q(1500, { t: 'spoke', text: "On it. I'll report back.", at: at() });
  q(200,  { t: 'state', state: 'listening' });
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

          case 'context':
            return { ...s, attendees: e.attendees, topic: e.agenda ?? s.topic };

          default:
            return s;
        }
      });
    });
    return () => { unsub(); };
  }, []);

  // Dev sim — activated with ?devsim=1 in the URL
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('devsim')) {
      runDevSim();
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

      {/* Aravind's voice controller — mounts ?sim=1 replay with no mic or key needed */}
      <VoiceController />

    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { bus } from '@/lib/contract';
import type { RallyState, RallyEvent, ActionCard } from '@/lib/contract';
import Orb from './Orb';
import Transcript, { type TranscriptLine } from './Transcript';
import ActionFeed from './ActionFeed';

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

// ── Dev sim — fires fake events so Hemanth can test the UI without Aravind ───
// Activate with ?devsim=1. Separate from Aravind's ?sim=1 full-meeting replay.
function runDevSim() {
  const emit = (e: RallyEvent) => bus.emit(e);
  let t = 0;
  const at = () => Date.now();

  const q = (ms: number, e: RallyEvent) => setTimeout(() => emit(e), (t += ms));

  q(400,  { t: 'state', state: 'listening' });
  q(800,  { t: 'context', attendees: ['Priya', 'Sam', 'Alex'], agenda: 'Upload Reliability Review' });
  q(1200, { t: 'heard', id: '1', text: 'yeah the signup flow 500s on Safari', final: true, at: at() });
  q(800,  { t: 'heard', id: '2', text: 'I saw that this morning too', speaker: 'Sam', final: true, at: at() });
  q(600,  { t: 'heard', id: '3', text: 'Rally, file that', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, file that', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(400,  { t: 'thinking', label: 'Filing task…' });
  q(200,  { t: 'state', state: 'working' });
  q(1200, { t: 'state', state: 'speaking' });
  q(2000, { t: 'spoke', text: "Filed 'Signup flow 500s on Safari', assigned to Priya.", at: at() });
  q(200,  { t: 'state', state: 'listening' });
  q(1500, { t: 'heard', id: '4', text: 'Rally, book thirty minutes with Priya tomorrow and send a recap', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, book thirty minutes with Priya tomorrow', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(300,  { t: 'state', state: 'working' });
  q(1500, { t: 'state', state: 'speaking' });
  q(2000, { t: 'spoke', text: "Booked 30 minutes with Priya tomorrow at 3 PM. Recap sent.", at: at() });
  q(200,  { t: 'state', state: 'listening' });
  q(1200, { t: 'heard', id: '5', text: 'Rally, was Safari broken last week too?', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, was Safari broken last week', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(300,  { t: 'state', state: 'working' });
  q(1200, { t: 'state', state: 'speaking' });
  q(2500, { t: 'spoke', text: "Yes — Safari 17 has a known fetch bug with large request bodies. I noted it in last week's review.", at: at() });
  q(200,  { t: 'state', state: 'listening' });
  q(1000, { t: 'heard', id: '6', text: 'Rally, look into whether this is a known bug and report back', final: true, at: at() });
  q(200,  { t: 'wake', utterance: 'Rally, look into', at: at() });
  q(100,  { t: 'state', state: 'armed' });
  q(300,  { t: 'state', state: 'working' });
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

  // Poll action feed every 2 s
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
    return bus.on((e: RallyEvent) => {
      setState((s) => {
        switch (e.t) {
          case 'state':
            return { ...s, rallyState: e.state };

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

          case 'tool_start':
          case 'tool_done':
            return { ...s, thinking: null };

          case 'context':
            return { ...s, attendees: e.attendees, topic: e.agenda ?? s.topic };

          default:
            return s;
        }
      });
    });
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
    </div>
  );
}

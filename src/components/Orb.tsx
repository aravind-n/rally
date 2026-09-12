'use client';

import type { RallyState } from '@/lib/contract';

interface OrbProps {
  state: RallyState;
}

export default function Orb({ state }: OrbProps) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
      {/* Ping ring — armed / speaking */}
      {(state === 'armed' || state === 'speaking') && (
        <div
          className={`absolute inset-0 rounded-full animate-ping opacity-20
            ${state === 'armed' ? 'bg-blue-400' : 'bg-emerald-400'}`}
        />
      )}

      {/* Spinning arc — working */}
      {state === 'working' && (
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
      )}

      {/* Core */}
      <div
        className={`rounded-full w-14 h-14 transition-all duration-700
          ${state === 'offline'   ? 'bg-white/10'                                             : ''}
          ${state === 'listening' ? 'bg-blue-800/50 animate-breathe shadow-[0_0_40px_rgba(59,130,246,0.15)]'  : ''}
          ${state === 'armed'     ? 'bg-blue-400 shadow-[0_0_60px_rgba(96,165,250,0.7)]'      : ''}
          ${state === 'working'   ? 'bg-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)]'  : ''}
          ${state === 'speaking'  ? 'bg-emerald-400 animate-orb-pulse shadow-[0_0_60px_rgba(34,197,94,0.6)]' : ''}
        `}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

export interface TranscriptLine {
  id: string;
  text: string;
  speaker?: string;
  isWake: boolean;
  at: number;
}

interface TranscriptProps {
  lines: TranscriptLine[];
}

export default function Transcript({ lines }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const transcript = scrollRef.current;
    if (!transcript) return;
    transcript.scrollTo({ top: transcript.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="flex-1 flex items-start pt-6">
        <p className="text-white/15 text-sm font-mono">waiting for audio…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-h-0">
      <div className="text-[10px] tracking-[0.2em] text-white/20 mb-2 uppercase">Transcript</div>
      <div ref={scrollRef} className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto pr-2">
        {lines.map((line, i) => {
          const isRally = line.speaker === 'Rally';
          return (
            <div
              key={line.id}
              className={`text-sm leading-relaxed animate-fade-up
                ${isRally
                  ? 'pl-3 border-l-2 border-emerald-400 text-emerald-300 italic'
                  : line.isWake
                    ? 'pl-3 border-l-2 border-blue-400 text-white font-medium'
                    : 'pl-3 text-white/55'
                }`}
              style={{ animationDelay: `${i * 15}ms` }}
            >
              {line.speaker && (
                <span className={`text-[10px] mr-2 uppercase tracking-wider ${isRally ? 'text-emerald-400/70' : 'text-white/25'}`}>
                  {line.speaker}
                </span>
              )}
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

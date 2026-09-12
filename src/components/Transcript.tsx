'use client';

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
  if (lines.length === 0) {
    return (
      <div className="flex-1 flex items-start pt-6">
        <p className="text-white/15 text-sm font-mono">waiting for audio…</p>
      </div>
    );
  }

  // Show the last 14 lines
  const visible = lines.slice(-14);

  return (
    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-h-0">
      <div className="text-[10px] tracking-[0.2em] text-white/20 mb-2 uppercase">Transcript</div>
      <div className="flex flex-col gap-1.5 overflow-hidden">
        {visible.map((line, i) => (
          <div
            key={line.id}
            className={`text-sm leading-relaxed animate-fade-up
              ${line.isWake
                ? 'pl-3 border-l-2 border-blue-400 text-white font-medium'
                : 'pl-3 text-white/55'
              }`}
            style={{ animationDelay: `${i * 15}ms` }}
          >
            {line.speaker && (
              <span className="text-[10px] text-white/25 mr-2 uppercase tracking-wider">
                {line.speaker}
              </span>
            )}
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

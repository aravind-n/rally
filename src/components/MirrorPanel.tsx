'use client';

import { useEffect, useState } from 'react';
import type { ActionCard } from '@/lib/contract';

const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_AMBIGUOUS_WORKSPACE_URL ?? 'https://app.ambiguous.ai';

export default function MirrorPanel() {
  const [cards, setCards] = useState<ActionCard[]>([]);

  useEffect(() => {
    let stopped = false;
    const refresh = async () => {
      try {
        const response = await fetch('/api/feed', { cache: 'no-store' });
        if (response.ok && !stopped) setCards(await response.json() as ActionCard[]);
      } catch {
        // The left-side action feed still carries the demo if polling misses a beat.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 700);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="h-full flex flex-col border-l border-white/[0.05] bg-[#0d0f13]">
      <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-violet-500/80 flex items-center justify-center text-[11px] font-bold">A</div>
          <div>
            <p className="text-xs font-semibold text-white/80">Ambiguous</p>
            <p className="text-[9px] tracking-[0.16em] text-white/25 uppercase">Team Rocket · Live activity</p>
          </div>
        </div>
        <a
          href={WORKSPACE_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-white/40 hover:text-white/70 transition-colors font-mono"
        >
          open real workspace ↗
        </a>
      </div>

      <div className="shrink-0 flex gap-5 px-5 py-2.5 border-b border-white/[0.05] text-[10px] text-white/30">
        <span className="text-violet-300 border-b border-violet-400 pb-2.5 -mb-2.5">Activity</span>
        <span>Tasks</span><span>Mail</span><span>Calendar</span><span>Docs</span>
      </div>

      {/* Demo opener — "2 days ago" Rally message. This is the first thing the
          audience sees before the demo starts. It proves the slow brain already
          worked before anyone said a word. */}
      <div className="shrink-0 mx-4 mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400/60" />
            </div>
            <span className="text-[11px] font-semibold text-amber-400/80">Rally</span>
            <span className="text-[10px] text-white/20">· #incident-response</span>
          </div>
          <span className="text-[10px] text-white/20">2 days ago</span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed">
          Team — the November 14 connection pool fix (<span className="font-mono text-white/40">max_connections=500</span>) is due for
          a quarterly review. No action was taken after the December check-in was missed.
          Flagging before it becomes an incident again.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-[10px] tracking-[0.16em] text-white/25 uppercase">Rally activity</span>
          <span className="flex items-center gap-1.5 text-[9px] text-emerald-400/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> syncing
          </span>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/25">
            Rally&apos;s workspace actions will appear here.
          </div>
        ) : cards.slice(0, 10).map((card) => (
          <div key={card.id} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3.5 shadow-lg shadow-black/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-violet-400/10 text-violet-300/80 flex items-center justify-center text-[10px] font-semibold">
                {card.app.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-white/30">{card.app} · created by Rally</span>
                  <span className={card.status === 'failed' ? 'text-[9px] text-rose-300' : card.status === 'pending' ? 'text-[9px] text-amber-300' : 'text-[9px] text-emerald-300'}>
                    {card.status}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-white/75 leading-snug">{card.title}</p>
                {card.subtitle && <p className="mt-1 text-[10px] text-white/35 leading-relaxed">{card.subtitle}</p>}
                {card.meta && card.meta.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {card.meta.map((item) => <span key={item} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/35">{item}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

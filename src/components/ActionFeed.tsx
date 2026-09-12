'use client';

import type { ActionCard } from '@/lib/contract';

const APP_COLORS: Record<ActionCard['app'], string> = {
  Tasks:    'text-blue-400    border-blue-400/30    bg-blue-400/8',
  Mail:     'text-purple-400  border-purple-400/30  bg-purple-400/8',
  Calendar: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/8',
  Docs:     'text-amber-400   border-amber-400/30   bg-amber-400/8',
  Chat:     'text-cyan-400    border-cyan-400/30    bg-cyan-400/8',
  Memory:   'text-pink-400    border-pink-400/30    bg-pink-400/8',
  Brain:    'text-orange-400  border-orange-400/30  bg-orange-400/8',
};

const STATUS_ICON: Record<ActionCard['status'], string> = {
  done:    '✓',
  pending: '◌',
  failed:  '✗',
};

const STATUS_COLOR: Record<ActionCard['status'], string> = {
  done:    'text-emerald-400',
  pending: 'text-white/30',
  failed:  'text-red-400',
};

function Card({ card, index }: { card: ActionCard; index: number }) {
  const appColor = APP_COLORS[card.app];

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#131313] p-3.5 animate-slide-in-right"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* App badge + status */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border ${appColor}`}>
          {card.app.toUpperCase()}
        </span>
        <span className={`text-xs ${STATUS_COLOR[card.status]}`}>
          {STATUS_ICON[card.status]}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm text-white/90 font-medium leading-snug">{card.title}</p>

      {/* Subtitle */}
      {card.subtitle && (
        <p className="text-xs text-white/40 mt-1 leading-snug">{card.subtitle}</p>
      )}

      {/* Meta chips */}
      {card.meta && card.meta.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.meta.map((m) => (
            <span key={m} className="text-[10px] text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Deep link */}
      {card.url && card.url !== '#' && (
        <a
          href={card.url}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-white/20 hover:text-white/50 mt-2 block transition-colors"
        >
          Open in workspace →
        </a>
      )}
    </div>
  );
}

interface ActionFeedProps {
  cards: ActionCard[];
}

export default function ActionFeed({ cards }: ActionFeedProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <span className="text-[10px] tracking-[0.2em] text-white/20 uppercase">Actions</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {cards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-white/12 text-xs font-mono text-center leading-relaxed">
              say rally's name<br />to get started
            </p>
          </div>
        ) : (
          cards.map((c, i) => <Card key={c.id} card={c} index={i} />)
        )}
      </div>
    </div>
  );
}

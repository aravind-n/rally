'use client';

// Mirror panel — shows the live Ambiguous workspace beside the room display.
// Activated by ?split=1 in the URL. Set NEXT_PUBLIC_AMBIGUOUS_WORKSPACE_URL in .env.local.

const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_AMBIGUOUS_WORKSPACE_URL ?? 'https://app.ambiguous.ai';

export default function MirrorPanel() {
  return (
    <div className="h-full flex flex-col border-l border-white/[0.05]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <span className="text-[10px] tracking-[0.2em] text-white/20 uppercase">Workspace</span>
        <a
          href={WORKSPACE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-white/20 hover:text-white/50 transition-colors font-mono"
        >
          open ↗
        </a>
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

      {/* Iframe */}
      <div className="flex-1 relative overflow-hidden bg-white/[0.01] mt-3">
        <iframe
          src={WORKSPACE_URL}
          title="Ambiguous workspace"
          className="absolute inset-0 w-full h-full border-0"
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
}

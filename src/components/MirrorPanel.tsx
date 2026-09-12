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

      {/* Iframe */}
      <div className="flex-1 relative overflow-hidden bg-white/[0.01]">
        <iframe
          src={WORKSPACE_URL}
          title="Ambiguous workspace"
          className="absolute inset-0 w-full h-full border-0"
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        />
        {/* Fallback overlay — shown when iframe blocked by X-Frame-Options */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-white/20 text-sm mb-3">Workspace can't be embedded.</p>
              <a
                href={WORKSPACE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400/60 hover:text-blue-400 text-xs underline"
              >
                Open in new window →
              </a>
            </div>
          </div>
        </noscript>
      </div>
    </div>
  );
}

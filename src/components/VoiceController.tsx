'use client';

import { useEffect } from 'react';
import { startRallySimulation } from '@/lib/voice/sim';
import { startRallyVoice } from '@/lib/voice/session';

export default function VoiceController() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sim') === '1') return startRallySimulation();

    let cancelled = false;
    let stop: (() => void) | undefined;

    startRallyVoice().then((cleanup) => {
      if (cancelled) cleanup();
      else stop = cleanup;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';
import { startRallySimulation } from '@/lib/voice/sim';
import { startRallyVoice } from '@/lib/voice/session';
import { installKeyboardOverrides } from '@/lib/voice/overrides';

export default function VoiceController() {
  useEffect(() => {
    const removeKeyboardOverrides = installKeyboardOverrides();
    const params = new URLSearchParams(window.location.search);
    if (params.get('sim') === '1') {
      const stopSimulation = startRallySimulation();
      return () => {
        stopSimulation();
        removeKeyboardOverrides();
      };
    }

    let cancelled = false;
    let stop: (() => void) | undefined;

    startRallyVoice().then((cleanup) => {
      if (cancelled) cleanup();
      else stop = cleanup;
    });

    return () => {
      cancelled = true;
      stop?.();
      removeKeyboardOverrides();
    };
  }, []);

  return null;
}

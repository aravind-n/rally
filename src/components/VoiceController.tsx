'use client';

import { useEffect } from 'react';
import { startRallySimulation } from '@/lib/voice/sim';

export default function VoiceController() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sim') !== '1') return;
    return startRallySimulation();
  }, []);

  return null;
}

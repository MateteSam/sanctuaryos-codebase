'use client';

import { useState, useCallback } from 'react';
import { BroadcastShell } from '@/components/broadcast/BroadcastShell';
import { atmospherePresets, type AtmospherePreset } from '@/data/atmospheres';

export default function AppPage() {
  const [activeAtmos, setActiveAtmos] = useState<AtmospherePreset>(atmospherePresets[0]);
  const [flowMode, setFlowMode]       = useState(true);

  const handleSelectAtmosphere = useCallback((preset: AtmospherePreset) => {
    setActiveAtmos(preset);
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atmosphere: preset.name,
        useMediaBackground: preset.mediaBackground,
        layoutStyle: preset.layoutStyle,
        textPosition: preset.textPosition,
        textStylePreset: preset.textStylePreset,
        textFontSize: preset.textFontSize,
        textFontFamily: preset.textFontFamily,
        showBranding: preset.showBranding,
        activeMediaOverlays: preset.activeMediaOverlays,
        activeSlide: null,
      }),
    }).catch(console.error);
  }, []);

  return (
    <BroadcastShell
      activeAtmos={activeAtmos}
      onSelectAtmosphere={handleSelectAtmosphere}
      flowMode={flowMode}
      onToggleFlowMode={() => setFlowMode(p => !p)}
    />
  );
}

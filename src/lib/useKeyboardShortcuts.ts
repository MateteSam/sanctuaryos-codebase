'use client';
import { useEffect, useCallback } from 'react';

export interface ShortcutActions {
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onToggleLive: () => void;
  onCut: () => void;
  onBlack: () => void;
  onClearOverlays: () => void;
  onToggleLowerThird: () => void;
  onToggleCountdown: () => void;
  onBreakSlide: () => void;
  onAtmosphere?: (index: number) => void; // 1-9
}

export function useKeyboardShortcuts(actions: ShortcutActions, enabled = true) {
  const handle = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    // Don't fire if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const { key, shiftKey, ctrlKey, metaKey } = e;
    if (ctrlKey || metaKey) return; // don't hijack browser shortcuts

    switch (true) {
      // Next / Prev slide
      case key === 'ArrowRight' || key === 'PageDown':
        e.preventDefault();
        actions.onNextSlide();
        break;
      case key === 'ArrowLeft' || key === 'PageUp':
        e.preventDefault();
        actions.onPrevSlide();
        break;

      // Space → Cut (same as many presentation tools)
      case key === ' ':
        e.preventDefault();
        actions.onCut();
        break;

      // Go Live toggle
      case key === 'Enter' && shiftKey:
        e.preventDefault();
        actions.onToggleLive();
        break;

      // B / F11 → Black screen
      case key === 'b' || key === 'B':
        if (!shiftKey) { e.preventDefault(); actions.onBlack(); }
        break;

      // C → Clear all overlays
      case key === 'c' || key === 'C':
        if (!shiftKey) { e.preventDefault(); actions.onClearOverlays(); }
        break;

      // L → Toggle lower thirds
      case key === 'l' || key === 'L':
        e.preventDefault();
        actions.onToggleLowerThird();
        break;

      // K → Countdown
      case key === 'k' || key === 'K':
        e.preventDefault();
        actions.onToggleCountdown();
        break;

      // Escape → Break / Standby
      case key === 'Escape':
        e.preventDefault();
        actions.onBreakSlide();
        break;

      // 1-9 → Atmosphere presets
      case /^[1-9]$/.test(key) && !shiftKey:
        e.preventDefault();
        actions.onAtmosphere?.(parseInt(key) - 1);
        break;
    }
  }, [actions, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handle]);
}

// Shortcut reference for display in the UI
export const SHORTCUT_MAP = [
  { key: '→ / PageDown',   action: 'Next Slide' },
  { key: '← / PageUp',    action: 'Previous Slide' },
  { key: 'Space',          action: 'Cut (switch cameras)' },
  { key: 'Shift+Enter',    action: 'Toggle Live / On Air' },
  { key: 'B',              action: 'Black Screen' },
  { key: 'C',              action: 'Clear All Overlays' },
  { key: 'L',              action: 'Toggle Lower Third' },
  { key: 'K',              action: 'Toggle Countdown' },
  { key: 'Esc',            action: 'Break / Standby Screen' },
  { key: '1 – 9',          action: 'Select Atmosphere Preset' },
];

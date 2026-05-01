'use client';

/**
 * SlidesStation — Slides, Bible, Style & Atmosphere control station.
 *
 * Operator controls: Lyrics setlist, Bible engine, lower thirds,
 * text style & positioning, overlays, and atmosphere presets.
 * Includes a live mini-preview of what's on Beam.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, BookOpen, Palette, Layers, ListChecks, Eye } from 'lucide-react';
import { useStationSync } from '@/lib/useStationSync';
import { useBibleApi, type BibleTranslation } from '@/lib/useBibleApi';
import { useVoiceBible } from '@/lib/useVoiceBible';
import { atmospherePresets, type AtmospherePreset } from '@/data/atmospheres';
import { sampleSet, type SlideData } from '@/data/lyrics';
import { buildCustomSlide, detectVerseReferences } from '@/data/verseDetector';
import { StationShell } from './StationShell';

import { SlidesTab } from '@/components/broadcast/tabs/SlidesTab';
import { BibleTab } from '@/components/broadcast/tabs/BibleTab';
import { StyleTab } from '@/components/broadcast/tabs/StyleTab';
import { AtmosTab } from '@/components/broadcast/tabs/AtmosTab';
import { ServiceTab } from '@/components/broadcast/tabs/ServiceTab';

type Tab = 'slides' | 'bible' | 'style' | 'atmos' | 'service';

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'slides',  icon: Type,       label: 'Set'     },
  { id: 'bible',   icon: BookOpen,   label: 'Bible'   },
  { id: 'style',   icon: Palette,    label: 'Style'   },
  { id: 'atmos',   icon: Layers,     label: 'Atmos'   },
  { id: 'service', icon: ListChecks, label: 'Flow'    },
];

export function SlidesStation() {
  const { liveState, connStatus, pushState } = useStationSync('slides');

  // Resolve atmosphere
  const activeAtmos = atmospherePresets.find(a => a.name === liveState?.atmosphere) || atmospherePresets[0];

  /* ── Slides ── */
  const [activeSlideIndex, setActiveSlideIndex] = useState(-1);
  const [customSlides, setCustomSlides] = useState<SlideData[]>([]);
  const [customText, setCustomText] = useState('');
  const [customRef, setCustomRef] = useState('');
  const [detectedVerses, setDetectedVerses] = useState<ReturnType<typeof detectVerseReferences>>([]);

  /* ── Bible ── */
  const [bibleTranslation, setBibleTranslation] = useState<BibleTranslation>('web');
  const [bibleSearchInput, setBibleSearchInput] = useState('');
  const { fetchVerse, isLoading: bibleLoading, error: bibleError, lastResult: bibleResult, clearResult: clearBibleResult } = useBibleApi();
  const { isSupported: voiceSupported, isListening, transcript: voiceTranscript, lastDetected: voiceDetected, error: voiceError, toggleListening } = useVoiceBible({
    onDetected: async (ref) => {
      const result = await fetchVerse(ref, bibleTranslation);
      if (result) {
        const slide: SlideData = { id: `voice-${Date.now()}`, type: 'scripture', title: result.reference, reference: result.reference, content: result.text };
        pushState({ activeSlide: slide }); setActiveSlideIndex(-99);
      }
    },
  });

  /* ── Style ── */
  const [textPosition, setTextPosition] = useState(activeAtmos.textPosition);
  const [textStylePreset, setTextStylePreset] = useState(activeAtmos.textStylePreset);
  const [textFontSize, setTextFontSize] = useState(activeAtmos.textFontSize);
  const [textFontFamily, setTextFontFamily] = useState<'sans' | 'scripture'>(activeAtmos.textFontFamily);
  const [showBranding, setShowBranding] = useState(activeAtmos.showBranding);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [activeMediaOverlays, setActiveMediaOverlays] = useState<string[]>(activeAtmos.activeMediaOverlays);
  const [overlayOpacities, setOverlayOpacities] = useState<Record<string, number>>({});
  const [lowerThirdText, setLowerThirdText] = useState('Pastor John Doe');
  const [lowerThirdSub, setLowerThirdSub] = useState('Senior Pastor');
  const [lowerThirdStyle, setLowerThirdStyle] = useState('classic');
  const [lowerThirdColor, setLowerThirdColor] = useState('#6EC9FF');

  /* ── Atmos ── */
  const [customAtmoses, setCustomAtmoses] = useState<AtmospherePreset[]>([]);
  const [atmosName, setAtmosName] = useState('');
  const [editingAtmos, setEditingAtmos] = useState(false);

  /* ── UI ── */
  const [activeTab, setActiveTab] = useState<Tab>('slides');
  const [showPreview, setShowPreview] = useState(false);

  const allSlides = [...sampleSet, ...customSlides];
  const activeSlide = activeSlideIndex >= 0 && activeSlideIndex < allSlides.length ? allSlides[activeSlideIndex] : null;

  // Sync overlay state from SSE
  useEffect(() => {
    if (!liveState) return;
    setActiveOverlay(liveState.activeOverlay);
    setActiveMediaOverlays(liveState.activeMediaOverlays ?? []);
  }, [liveState?.activeOverlay, liveState?.activeMediaOverlays]);

  useEffect(() => { setDetectedVerses(detectVerseReferences(customText)); }, [customText]);

  /* ── Handlers ── */
  const handleSlide = (idx: number) => {
    setActiveSlideIndex(idx);
    pushState({ activeSlide: allSlides[idx] || null, nextSlide: allSlides[idx + 1] || null });
  };
  const handleBiblePush = (verse: any) => {
    const slide: SlideData = { id: verse.id, type: 'scripture', reference: verse.reference, content: verse.text, title: verse.reference };
    pushState({ activeSlide: slide }); setActiveSlideIndex(-99);
  };
  const handleCustomPush = () => {
    if (!customText.trim()) return;
    const slide = buildCustomSlide(customText, customRef ? 'scripture' : 'lyric', customRef || undefined);
    setCustomSlides(p => [...p, slide]);
    setActiveSlideIndex(allSlides.length);
    pushState({ activeSlide: slide });
    setCustomText(''); setCustomRef(''); setDetectedVerses([]);
  };
  const handleOverlay = (id: string) => {
    const n = activeOverlay === id ? null : id;
    setActiveOverlay(n); pushState({ activeOverlay: n });
  };
  const handleLowerThird = () => {
    pushState({ lowerThirdText, lowerThirdSub, lowerThirdStyle, lowerThirdColor, activeOverlay: 'lower_thirds' });
    setActiveOverlay('lower_thirds');
  };
  const handleSelectAtmosphere = useCallback((preset: AtmospherePreset) => {
    setTextPosition(preset.textPosition);
    setTextStylePreset(preset.textStylePreset);
    setTextFontSize(preset.textFontSize);
    setTextFontFamily(preset.textFontFamily);
    setShowBranding(preset.showBranding);
    setActiveMediaOverlays(preset.activeMediaOverlays);
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

  const handleSaveAtmos = () => {
    if (!atmosName.trim()) return;
    const p: AtmospherePreset = { id: `custom-${Date.now()}`, name: atmosName, category: 'custom', description: 'Custom', icon: 'Wand2', gradient: 'from-slate-900 to-slate-950', accentColor: lowerThirdColor, textColor: '#FFFFFF', mediaBackground: false, layoutStyle: 'full_center', textPosition, textStylePreset, textFontSize, textFontFamily, showBranding, activeMediaOverlays };
    setCustomAtmoses(prev => [...prev, p]);
    setAtmosName(''); setEditingAtmos(false);
  };

  return (
    <StationShell station="slides" connStatus={connStatus} isLive={liveState?.isLive}>
      <div className="flex h-full">

        {/* ── TAB BAR (VERTICAL) ── */}
        <div className="w-16 border-r border-white/[0.04] bg-[#0A0B10] flex flex-col shrink-0">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center h-16 gap-1 text-[8px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === id ? 'text-sky-400 bg-white/[0.03]' : 'text-slate-600 hover:text-slate-400'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {activeTab === id && (
                <motion.div layoutId="activeStationTab"
                  className="absolute right-0 top-2 bottom-2 w-0.5 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              )}
            </button>
          ))}

          <div className="flex-1" />

          {/* Mini preview toggle */}
          <button onClick={() => setShowPreview(!showPreview)}
            className={`flex flex-col items-center justify-center h-16 gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${
              showPreview ? 'text-emerald-400' : 'text-slate-700 hover:text-slate-500'
            }`}>
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'slides' && <SlidesTab allSlides={allSlides} activeSlideIndex={activeSlideIndex} onSlide={handleSlide} onClear={() => { setActiveSlideIndex(-1); pushState({ activeSlide: null }); }} customText={customText} setCustomText={setCustomText} customRef={customRef} setCustomRef={setCustomRef} detectedVerses={detectedVerses} onPushDetected={(raw: string) => { const v = detectedVerses.find(d => d.raw === raw); if (v?.match) handleBiblePush(v.match as any); }} onCustomPush={handleCustomPush} activeAtmos={activeAtmos} />}
          {activeTab === 'bible' && <BibleTab bibleSearchInput={bibleSearchInput} setBibleSearchInput={setBibleSearchInput} bibleTranslation={bibleTranslation} setBibleTranslation={setBibleTranslation} bibleLoading={bibleLoading} bibleError={bibleError} bibleResult={bibleResult} onFetchVerse={() => bibleSearchInput.trim() && fetchVerse(bibleSearchInput.trim(), bibleTranslation)} onClearResult={clearBibleResult} onPushVerse={handleBiblePush} onPushResult={(slide) => { setCustomSlides(p => [...p, slide]); setActiveSlideIndex(allSlides.length); pushState({ activeSlide: slide }); }} voiceSupported={voiceSupported} isListening={isListening} voiceTranscript={voiceTranscript} voiceDetected={voiceDetected?.raw || ''} voiceError={voiceError} onToggleListening={toggleListening} activeAtmos={activeAtmos} />}
          {activeTab === 'style' && <StyleTab activeAtmos={activeAtmos} textPosition={textPosition} onPositionChange={v => { setTextPosition(v); pushState({ textPosition: v }); }} textStylePreset={textStylePreset} onPresetChange={v => { setTextStylePreset(v); pushState({ textStylePreset: v }); }} textFontSize={textFontSize} onFontSizeChange={v => { setTextFontSize(v); pushState({ textFontSize: v }); }} textFontFamily={textFontFamily} onFamilyChange={v => { setTextFontFamily(v); pushState({ textFontFamily: v }); }} useMedia={false} onToggleMedia={() => {}} showBranding={showBranding} onToggleBranding={() => { const n = !showBranding; setShowBranding(n); pushState({ showBranding: n }); }} layoutStyle="full_center" onLayoutChange={() => {}} activeMediaOverlays={activeMediaOverlays} onToggleOverlay={id => { const n = activeMediaOverlays.includes(id) ? activeMediaOverlays.filter(o => o !== id) : [...activeMediaOverlays, id]; setActiveMediaOverlays(n); pushState({ activeMediaOverlays: n }); }} overlayOpacities={overlayOpacities} onOpacityChange={(id, v) => setOverlayOpacities(p => ({ ...p, [id]: v }))} overlayBlends={{}} onBlendChange={() => {}} activeOverlay={activeOverlay} onToggleGraphic={handleOverlay} lowerThirdText={lowerThirdText} setLowerThirdText={setLowerThirdText} lowerThirdSub={lowerThirdSub} setLowerThirdSub={setLowerThirdSub} lowerThirdStyle={lowerThirdStyle} setLowerThirdStyle={setLowerThirdStyle} lowerThirdColor={lowerThirdColor} setLowerThirdColor={setLowerThirdColor} onPushLowerThird={handleLowerThird} />}
          {activeTab === 'atmos' && <AtmosTab activeAtmos={activeAtmos} customAtmoses={customAtmoses} onSelectAtmosphere={handleSelectAtmosphere} atmosVideoUrl={undefined} onSetVideoUrl={() => {}} customAtmosName={atmosName} setCustomAtmosName={setAtmosName} editingAtmos={editingAtmos} onToggleEditing={() => setEditingAtmos(v => !v)} onSaveCustomAtmos={handleSaveAtmos} />}
          {activeTab === 'service' && <ServiceTab activeAtmos={activeAtmos} cameras={[]} onProgramCut={() => {}} onPushState={pushState} />}
        </div>

        {/* ── LIVE PREVIEW PANEL ── */}
        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-l border-white/[0.04] bg-[#0A0B10] flex flex-col shrink-0 overflow-hidden">
              
              <div className="p-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Beam Preview</span>
                </div>
              </div>

              <div className="flex-1 p-4">
                {/* Mini Beam preview via iframe */}
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black relative">
                  <iframe src="/beam" className="w-full h-full border-none" style={{ pointerEvents: 'none' }} />
                  <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl" />
                </div>

                {/* Current state summary */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Atmosphere</span>
                    <span className="text-[10px] font-bold" style={{ color: activeAtmos.accentColor }}>{activeAtmos.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Active Slide</span>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[180px]">
                      {liveState?.activeSlide?.title || liveState?.activeSlide?.reference || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Overlay</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {liveState?.activeOverlay || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StationShell>
  );
}

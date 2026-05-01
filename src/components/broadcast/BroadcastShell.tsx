'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Wand2, Tv2, Send, Type, BookOpen, Palette, Layers, ListChecks, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal, X, Users, Cpu } from 'lucide-react';
import { sampleSet, type SlideData } from '@/data/lyrics';
import { buildCustomSlide, detectVerseReferences } from '@/data/verseDetector';
import { atmospherePresets, type AtmospherePreset } from '@/data/atmospheres';
import { useCameraManager } from '@/lib/useCameraManager';
import { useAudioEngine } from '@/lib/useAudioEngine';
import { useBibleApi, type BibleTranslation } from '@/lib/useBibleApi';
import { useVoiceBible } from '@/lib/useVoiceBible';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';

import { ProgramMonitor } from './ProgramMonitor';
import { SourceBank } from './SourceBank';
import { CameraSourcesPanel } from '../sections/CameraSourcesPanel';
import { AudioStrip } from './AudioStrip';
import { SonusProWorkspace } from './SonusProWorkspace';
import { TransitionPillar } from './TransitionPillar';

import { SlidesTab } from './tabs/SlidesTab';
import { BibleTab } from './tabs/BibleTab';
import { StyleTab } from './tabs/StyleTab';
import { AtmosTab } from './tabs/AtmosTab';
import { ServiceTab } from './tabs/ServiceTab';

type RightTab = 'slides' | 'bible' | 'style' | 'service' | 'atmos';

const TABS: { id: RightTab; icon: React.ElementType; label: string }[] = [
  { id: 'slides',  icon: Type,       label: 'Set'     },
  { id: 'bible',   icon: BookOpen,   label: 'Bible'   },
  { id: 'style',   icon: Palette,    label: 'Style'   },
  { id: 'service', icon: ListChecks, label: 'Service' },
  { id: 'atmos',   icon: Layers,     label: 'Atmos'   },
];

export function BroadcastShell({
  activeAtmos, onSelectAtmosphere, flowMode, onToggleFlowMode,
}: {
  activeAtmos: AtmospherePreset;
  onSelectAtmosphere: (p: AtmospherePreset) => void;
  flowMode: boolean;
  onToggleFlowMode: () => void;
}) {
  const { cameras, hostId, permissionState, isLoadingDevices, connectLocalCamera, disconnectCamera, refreshLocalDevices, clearDisconnected, isCinematicMode, setIsCinematicMode, genesisPreset, setGenesisPreset, genesisConfig, setGenesisConfig } = useCameraManager();
  const { channels, channelLevels, buses, busLevels, clipping, peakHold, compGainReduction,
    masterVolume, setMasterVolume, masterMuted, setMasterMuted,
    autoMix, setAutoMix, autoDuck, setAutoDuck, audioContextState, broadcastStream,
    setChannelVolume, toggleChannelMute, toggleChannelSolo,
    setPreAmpGain, setChannelEQ, setHPFFreq, toggleGate, toggleComp,
    setChannelSend, setBusMasterLevel, toggleBusMute,
    dominantChannelId, togglePastorMic, setAuxSend,
    applyChannelPreset, addVirtualChannel } = useAudioEngine(cameras);

  const [programCamId, setProgramCamId] = useState<string | null>(null);
  const [previewCamId, setPreviewCamId]  = useState<string | null>(null);
  const [isFading, setIsFading]          = useState(false);
  const [isLive, setIsLive]              = useState(false);
  const [outputMode, setOutputMode]      = useState<string>('graphics');
  const [tBarValue, setTBarValue]        = useState(0);

  const programVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const [showAudioWorkspace, setShowAudioWorkspace] = useState(false);

  /* ── Overlays ── */
  const [activeOverlay, setActiveOverlay]         = useState<string | null>(null);
  const [lowerThirdText, setLowerThirdText]        = useState('Pastor John Doe');
  const [lowerThirdSub, setLowerThirdSub]          = useState('Senior Pastor');
  const [lowerThirdStyle, setLowerThirdStyle]      = useState('classic');
  const [lowerThirdColor, setLowerThirdColor]      = useState('#6EC9FF');
  const [activeMediaOverlays, setActiveMediaOverlays] = useState<string[]>(activeAtmos.activeMediaOverlays);
  const [overlayOpacities, setOverlayOpacities]    = useState<Record<string, number>>({});

  /* ── Style ── */
  const [textPosition,    setTextPosition]    = useState(activeAtmos.textPosition);
  const [textStylePreset, setTextStylePreset] = useState(activeAtmos.textStylePreset);
  const [textFontSize,    setTextFontSize]    = useState(activeAtmos.textFontSize);
  const [textFontFamily,  setTextFontFamily]  = useState<'sans'|'scripture'>(activeAtmos.textFontFamily);
  const [showBranding,    setShowBranding]    = useState(activeAtmos.showBranding);

  /* ── Slides ── */
  const [activeSlideIndex, setActiveSlideIndex] = useState(-1);
  const [customSlides, setCustomSlides]          = useState<SlideData[]>([]);
  const [customText, setCustomText]              = useState('');
  const [customRef,  setCustomRef]               = useState('');
  const [detectedVerses, setDetectedVerses]      = useState<ReturnType<typeof detectVerseReferences>>([]);

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

  /* ── Atmos ── */
  const [customAtmoses,  setCustomAtmoses]  = useState<AtmospherePreset[]>([]);
  const [atmosName,      setAtmosName]      = useState('');
  const [editingAtmos,   setEditingAtmos]   = useState(false);

  /* ── UI ── */
  const [rightTab,      setRightTab]      = useState<RightTab>('slides');
  const [showTabs,      setShowTabs]      = useState(true);
  const [autoDirector,  setAutoDirector]  = useState(false);
  const [directorCue,   setDirectorCue]   = useState('');

  /* ── Performance ── */
  const [renderMs, setRenderMs] = useState<string>('--');
  const lastFrameRef = useRef<number>(0);

  const allSlides  = [...sampleSet, ...customSlides];
  const activeSlide = activeSlideIndex >= 0 && activeSlideIndex < allSlides.length ? allSlides[activeSlideIndex] : null;

  /* ── Push state ── */
  const pendingPatch  = useRef<Record<string, any>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPatch = useCallback(() => {
    const patch = pendingPatch.current;
    if (!Object.keys(patch).length) return;
    pendingPatch.current = {};
    fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(console.error);
  }, []);

  const pushState = useCallback((patch: Record<string, any>) => {
    Object.assign(pendingPatch.current, patch);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(flushPatch, 80);
  }, [flushPatch]);

  /* ── Effects ── */
  useEffect(() => { if (!cameras.length) return; setProgramCamId(p => p ?? cameras[0]?.id ?? null); setPreviewCamId(p => p ?? cameras[1]?.id ?? cameras[0]?.id ?? null); }, [cameras]);
  useEffect(() => { setDetectedVerses(detectVerseReferences(customText)); }, [customText]);
  useEffect(() => {
    let rafId: number;
    const measure = (ts: number) => {
      if (lastFrameRef.current > 0) setRenderMs((ts - lastFrameRef.current).toFixed(1));
      lastFrameRef.current = ts;
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /* ── Handlers ── */
  const handleCut = () => { const p = programCamId, n = previewCamId; setProgramCamId(n); setPreviewCamId(p); pushState({ programCamera: n, previewCamera: p }); };
  const handleFade = () => { if (isFading) return; setIsFading(true); setTimeout(() => { const p = programCamId, n = previewCamId; setProgramCamId(n); setPreviewCamId(p); pushState({ programCamera: n, previewCamera: p }); setIsFading(false); }, 600); };
  const handleToggleLive = () => { const n = !isLive; setIsLive(n); pushState({ isLive: n }); };
  const handleOverlay = (id: string) => { const n = activeOverlay === id ? null : id; setActiveOverlay(n); pushState({ activeOverlay: n }); };
  const handleSlide = (idx: number) => { setActiveSlideIndex(idx); pushState({ activeSlide: allSlides[idx] || null, nextSlide: allSlides[idx + 1] || null }); };
  const handleBiblePush = (verse: any) => { const slide: SlideData = { id: verse.id, type: 'scripture', reference: verse.reference, content: verse.text, title: verse.reference }; pushState({ activeSlide: slide }); setActiveSlideIndex(-99); };
  const handleCustomPush = () => { if (!customText.trim()) return; const slide = buildCustomSlide(customText, customRef ? 'scripture' : 'lyric', customRef || undefined); setCustomSlides(p => [...p, slide]); setActiveSlideIndex(allSlides.length); pushState({ activeSlide: slide }); setCustomText(''); setCustomRef(''); setDetectedVerses([]); };
  const handleLowerThird = () => { pushState({ lowerThirdText, lowerThirdSub, lowerThirdStyle, lowerThirdColor, activeOverlay: 'lower_thirds' }); setActiveOverlay('lower_thirds'); };
  const handleSaveAtmos = () => { if (!atmosName.trim()) return; const p: AtmospherePreset = { id: `custom-${Date.now()}`, name: atmosName, category: 'custom', description: 'Custom', icon: 'Wand2', gradient: 'from-slate-900 to-slate-950', accentColor: lowerThirdColor, textColor: '#FFFFFF', mediaBackground: false, layoutStyle: 'full_center', textPosition, textStylePreset, textFontSize, textFontFamily, showBranding, activeMediaOverlays }; setCustomAtmoses(prev => [...prev, p]); setAtmosName(''); setEditingAtmos(false); };
  const sendCue = () => { if (!directorCue.trim() || !hostId) return; cameras.filter(c => c.type === 'rtc' && c.peerId).forEach(c => fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: hostId, to: c.peerId, action: 'cue', payload: { text: directorCue.trim() } }) }).catch(console.error)); setDirectorCue(''); };

  useKeyboardShortcuts({
    onNextSlide: () => { if (activeSlideIndex < allSlides.length - 1) handleSlide(activeSlideIndex + 1); },
    onPrevSlide: () => { if (activeSlideIndex > 0) handleSlide(activeSlideIndex - 1); },
    onToggleLive: handleToggleLive, onCut: handleCut,
    onBlack: () => { setActiveOverlay('bug_off'); pushState({ activeOverlay: 'bug_off' }); },
    onClearOverlays: () => { setActiveMediaOverlays([]); setActiveOverlay(null); pushState({ activeMediaOverlays: [], activeOverlay: null }); },
    onToggleLowerThird: () => activeOverlay === 'lower_thirds' ? (setActiveOverlay(null), pushState({ activeOverlay: null })) : handleLowerThird(),
    onToggleCountdown: () => setRightTab('service'),
    onBreakSlide: () => { const n = activeOverlay === 'break' ? null : 'break'; setActiveOverlay(n); pushState({ activeOverlay: n }); },
  });

  const programCam = cameras.find(c => c.id === programCamId);
  const previewCam = cameras.find(c => c.id === previewCamId);

  return (
    <div className="h-screen flex flex-col bg-[#05060B] font-outfit text-[#e2e8f0] overflow-hidden selection:bg-sky-500/30">

      {/* ── TOP STATUS BAR ── */}
      <div className="flex items-center justify-between px-6 h-12 bg-[#0A0B10] border-b border-white/[0.04] shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 tally-live' : 'bg-slate-800'}`} />
             <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-sky-500 leading-none">SANCTUARY OS</span>
                <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-1">Sovereign Broadcast Node</span>
             </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-1 border border-white/[0.04]">
             <span className="pro-label text-slate-700">Preset:</span>
             <span className="text-[9px] font-black uppercase text-slate-400" style={{ color: activeAtmos.accentColor }}>{activeAtmos.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-black/60 rounded-xl px-4 py-1.5 border border-white/[0.08]">
              <input value={directorCue} onChange={e => setDirectorCue(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendCue()}
                placeholder="SEND CUE TO OPS..." className="bg-transparent text-[10px] outline-none w-32 uppercase font-black tracking-widest placeholder-slate-800" />
              <button onClick={sendCue} className="text-slate-700 hover:text-sky-500"><Send className="w-3.5 h-3.5" /></button>
           </div>
           
           <div className="h-6 w-px bg-white/5" />

           <motion.button onClick={() => setShowAudioWorkspace(v => !v)} whileTap={{ scale: 0.96 }}
             className={`px-4 py-2 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAudioWorkspace ? 'bg-sky-600 shadow-[0_0_20px_rgba(14,165,233,0.4)]' : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}>
             <SlidersHorizontal className="w-3.5 h-3.5" /> MIXER
           </motion.button>

           <div className="h-6 w-px bg-white/5" />

           <motion.button onClick={handleToggleLive} whileTap={{ scale: 0.96 }}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10'}`}>
             {isLive ? 'LIVE' : 'GO LIVE'}
           </motion.button>

           <button onClick={() => setShowTabs(!showTabs)} className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${showTabs ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-700'}`}>
              <Settings2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* CENTER DECK */}
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
           
           {/* UPPER: MONITOR QUADRANT */}
           <div className="flex-1 flex gap-4 min-h-0">
              <ProgramMonitor 
                type="preview" cam={previewCam} videoRef={previewVideoRef} 
                outputMode={outputMode} activeAtmos={activeAtmos} activeSlide={activeSlide}
                textPosition={textPosition} textStylePreset={textStylePreset}
                textFontSize={textFontSize} textFontFamily={textFontFamily}
                activeOverlay={activeOverlay} activeMediaOverlays={activeMediaOverlays}
                overlayOpacities={overlayOpacities} showBranding={showBranding} isFading={false}
                lowerThirdText={lowerThirdText} lowerThirdSub={lowerThirdSub}
                lowerThirdStyle={lowerThirdStyle} lowerThirdColor={lowerThirdColor}
              />

              <TransitionPillar 
                onCut={handleCut} onFade={handleFade} isFading={isFading}
                tBarValue={tBarValue} setTBarValue={setTBarValue}
              />

              <ProgramMonitor 
                type="program" cam={programCam} videoRef={programVideoRef} 
                outputMode={outputMode} activeAtmos={activeAtmos} activeSlide={activeSlide}
                textPosition={textPosition} textStylePreset={textStylePreset}
                textFontSize={textFontSize} textFontFamily={textFontFamily}
                activeOverlay={activeOverlay} activeMediaOverlays={activeMediaOverlays}
                overlayOpacities={overlayOpacities} showBranding={showBranding} isFading={isFading} isLive={isLive}
                lowerThirdText={lowerThirdText} lowerThirdSub={lowerThirdSub}
                lowerThirdStyle={lowerThirdStyle} lowerThirdColor={lowerThirdColor}
              />
           </div>

           {/* LOWER: SOURCE BANK — full width, proper height */}
           <div className="flex-1 min-h-[200px] min-w-0">
               <SourceBank cameras={cameras} programCamId={programCamId} previewCamId={previewCamId}
                 channelLevels={channelLevels}
                 isCinematicMode={isCinematicMode} setIsCinematicMode={setIsCinematicMode}
                 genesisPreset={genesisPreset} setGenesisPreset={setGenesisPreset}
                 onSelectCamera={id => { setPreviewCamId(id); pushState({ previewCamera: id }); }}
                 onOpenSettings={() => setShowCameraPanel(true)} isLoadingDevices={isLoadingDevices} />
           </div>

        </div>

        {/* SIDE: AUXILIARY TABS */}
        <AnimatePresence>
          {showTabs && (
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              className="w-[400px] border-l border-white/[0.04] bg-[#0A0B10] flex flex-col shrink-0 z-40">
              <div className="flex border-b border-white/[0.04] bg-black/20 shrink-0">
                {TABS.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setRightTab(id)}
                    className={`flex-1 flex flex-col items-center justify-center h-16 gap-1 text-[9px] font-black uppercase tracking-widest transition-all relative ${rightTab === id ? 'text-sky-400 bg-white/[0.03]' : 'text-slate-600 hover:text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                    {rightTab === id && <motion.div layoutId="activeTabSide" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {rightTab === 'slides' && <SlidesTab allSlides={allSlides} activeSlideIndex={activeSlideIndex} onSlide={handleSlide} onClear={() => { setActiveSlideIndex(-1); pushState({ activeSlide: null }); }} customText={customText} setCustomText={setCustomText} customRef={customRef} setCustomRef={setCustomRef} detectedVerses={detectedVerses} onPushDetected={(raw: string) => { const v = detectedVerses.find(d => d.raw === raw); if (v?.match) handleBiblePush(v.match as any); }} onCustomPush={handleCustomPush} activeAtmos={activeAtmos} />}
                {rightTab === 'bible' && <BibleTab bibleSearchInput={bibleSearchInput} setBibleSearchInput={setBibleSearchInput} bibleTranslation={bibleTranslation} setBibleTranslation={setBibleTranslation} bibleLoading={bibleLoading} bibleError={bibleError} bibleResult={bibleResult} onFetchVerse={() => bibleSearchInput.trim() && fetchVerse(bibleSearchInput.trim(), bibleTranslation)} onClearResult={clearBibleResult} onPushVerse={handleBiblePush} onPushResult={(slide) => { setCustomSlides(p => [...p, slide]); setActiveSlideIndex(allSlides.length); pushState({ activeSlide: slide }); }} voiceSupported={voiceSupported} isListening={isListening} voiceTranscript={voiceTranscript} voiceDetected={voiceDetected?.raw || ''} voiceError={voiceError} onToggleListening={toggleListening} activeAtmos={activeAtmos} />}
                {rightTab === 'style' && <StyleTab activeAtmos={activeAtmos} textPosition={textPosition} onPositionChange={v => { setTextPosition(v); pushState({ textPosition: v }); }} textStylePreset={textStylePreset} onPresetChange={v => { setTextStylePreset(v); pushState({ textStylePreset: v }); }} textFontSize={textFontSize} onFontSizeChange={v => { setTextFontSize(v); pushState({ textFontSize: v }); }} textFontFamily={textFontFamily} onFamilyChange={v => { setTextFontFamily(v); pushState({ textFontFamily: v }); }} useMedia={false} onToggleMedia={() => {}} showBranding={showBranding} onToggleBranding={() => { const n = !showBranding; setShowBranding(n); pushState({ showBranding: n }); }} layoutStyle="full_center" onLayoutChange={() => {}} activeMediaOverlays={activeMediaOverlays} onToggleOverlay={id => { const n = activeMediaOverlays.includes(id) ? activeMediaOverlays.filter(o => o !== id) : [...activeMediaOverlays, id]; setActiveMediaOverlays(n); pushState({ activeMediaOverlays: n }); }} overlayOpacities={overlayOpacities} onOpacityChange={(id, v) => setOverlayOpacities(p => ({ ...p, [id]: v }))} overlayBlends={{}} onBlendChange={() => {}} activeOverlay={activeOverlay} onToggleGraphic={handleOverlay} lowerThirdText={lowerThirdText} setLowerThirdText={setLowerThirdText} lowerThirdSub={lowerThirdSub} setLowerThirdSub={setLowerThirdSub} lowerThirdStyle={lowerThirdStyle} setLowerThirdStyle={setLowerThirdStyle} lowerThirdColor={lowerThirdColor} setLowerThirdColor={setLowerThirdColor} onPushLowerThird={handleLowerThird} />}
                {rightTab === 'service' && <ServiceTab activeAtmos={activeAtmos} cameras={cameras} onProgramCut={id => { setProgramCamId(id); pushState({ programCamera: id }); }} onPushState={pushState} />}
                {rightTab === 'atmos' && <AtmosTab activeAtmos={activeAtmos} customAtmoses={customAtmoses} onSelectAtmosphere={onSelectAtmosphere} atmosVideoUrl={undefined} onSetVideoUrl={() => {}} customAtmosName={atmosName} setCustomAtmosName={setAtmosName} editingAtmos={editingAtmos} onToggleEditing={() => setEditingAtmos(v => !v)} onSaveCustomAtmos={handleSaveAtmos} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SONUS AUDIO WORKSPACE (FULL OVERLAY) ── */}
      <AnimatePresence>
        {showAudioWorkspace && (
          <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[60]">
            <SonusProWorkspace
              channels={channels} channelLevels={channelLevels}
              clipping={clipping} peakHold={peakHold}
              buses={buses} busLevels={busLevels}
              autoMix={autoMix} setAutoMix={setAutoMix}
              autoDuck={autoDuck} setAutoDuck={setAutoDuck}
              compGainReduction={compGainReduction}
              audioContextState={audioContextState} broadcastStream={broadcastStream}
              setChannelVolume={setChannelVolume}
              toggleChannelMute={toggleChannelMute}
              toggleChannelSolo={toggleChannelSolo}
              setChannelSend={setChannelSend}
              setPreAmpGain={setPreAmpGain}
              setChannelEQ={setChannelEQ}
              setHPFFreq={setHPFFreq}
              toggleGate={toggleGate}
              toggleComp={toggleComp}
              setBusMasterLevel={setBusMasterLevel}
              toggleBusMute={toggleBusMute}
              applyChannelPreset={applyChannelPreset}
              addVirtualChannel={addVirtualChannel}
              onClose={() => setShowAudioWorkspace(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM DATA BAR ── */}
      <div className="h-8 bg-[#05060B] border-t border-white/[0.04] flex items-center justify-between px-6 shrink-0 relative z-50">
        <div className="flex gap-6 items-center">
           <div className="flex items-center gap-1.5">
              <span className="pro-label text-slate-700">FRAME:</span>
              <span className={`text-[9px] font-mono font-bold ${
                renderMs === '--' ? 'text-slate-500'
                  : parseFloat(renderMs) > 33 ? 'text-red-400'
                  : parseFloat(renderMs) > 16.7 ? 'text-amber-400'
                  : 'text-emerald-500'
              }`}>{renderMs}ms</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <a href="/ops" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all group">
             <Users className="w-3 h-3" />
             <span className="text-[9px] font-black uppercase tracking-widest">Multi-Ops</span>
           </a>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]" />
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Signaling Active</span>
           </div>
           <span className="text-[9px] font-mono text-slate-800">STREAMING CORE 4.2.1-PRO</span>
        </div>
      </div>

      {/* ── CAMERA MANAGER MODAL ── */}
      <AnimatePresence>
        {showCameraPanel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-5xl max-h-full">
               <CameraSourcesPanel
                  cameras={cameras} hostId={hostId} permissionState={permissionState}
                  isLoadingDevices={isLoadingDevices}
                  onConnect={connectLocalCamera} onDisconnect={disconnectCamera}
                  onRefresh={refreshLocalDevices} onClearDisconnected={clearDisconnected}
                  onClose={() => setShowCameraPanel(false)}
                  isCinematicMode={isCinematicMode} setIsCinematicMode={setIsCinematicMode}
                  genesisPreset={genesisPreset} setGenesisPreset={setGenesisPreset}
                  genesisConfig={genesisConfig} setGenesisConfig={setGenesisConfig}
               />
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}


'use client';

/**
 * DirectorStation — Camera switching & transition control station.
 *
 * Operator controls: Program/Preview monitors, camera source bank,
 * Cut/Fade transitions, GO LIVE toggle, and director cue system.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Radio, Send, Tv2 } from 'lucide-react';
import { useCameraManager } from '@/lib/useCameraManager';
import { useStationSync } from '@/lib/useStationSync';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { atmospherePresets, type AtmospherePreset } from '@/data/atmospheres';
import { ProgramMonitor } from '@/components/broadcast/ProgramMonitor';
import { SourceBank } from '@/components/broadcast/SourceBank';
import { TransitionPillar } from '@/components/broadcast/TransitionPillar';
import { CameraSourcesPanel } from '@/components/sections/CameraSourcesPanel';
import { StationShell } from './StationShell';

export function DirectorStation() {
  const { liveState, connStatus, pushState } = useStationSync('director');

  const {
    cameras, hostId, permissionState, isLoadingDevices,
    connectLocalCamera, disconnectCamera, refreshLocalDevices, clearDisconnected,
    isCinematicMode, setIsCinematicMode,
    genesisPreset, setGenesisPreset, genesisConfig, setGenesisConfig,
  } = useCameraManager();

  const [programCamId, setProgramCamId] = useState<string | null>(null);
  const [previewCamId, setPreviewCamId] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [tBarValue, setTBarValue] = useState(0);
  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const [directorCue, setDirectorCue] = useState('');
  const [autoDirector, setAutoDirector] = useState(false);

  const programVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Sync from SSE state
  useEffect(() => {
    if (!liveState) return;
    setIsLive(liveState.isLive);
    // If another station changed the camera, pick it up
    if (liveState.programCamera && liveState.programCamera !== programCamId) {
      setProgramCamId(liveState.programCamera);
    }
    if (liveState.previewCamera && liveState.previewCamera !== previewCamId) {
      setPreviewCamId(liveState.previewCamera);
    }
  }, [liveState]);

  // Auto-select first cameras
  useEffect(() => {
    if (!cameras.length) return;
    setProgramCamId(p => p ?? cameras[0]?.id ?? null);
    setPreviewCamId(p => p ?? cameras[1]?.id ?? cameras[0]?.id ?? null);
  }, [cameras]);

  // Resolve atmosphere from state
  const activeAtmos = atmospherePresets.find(a => a.name === liveState?.atmosphere) || atmospherePresets[0];

  // Handlers
  const handleCut = useCallback(() => {
    const p = programCamId, n = previewCamId;
    setProgramCamId(n); setPreviewCamId(p);
    pushState({ programCamera: n ?? undefined, previewCamera: p ?? undefined });
  }, [programCamId, previewCamId, pushState]);

  const handleFade = useCallback(() => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      const p = programCamId, n = previewCamId;
      setProgramCamId(n); setPreviewCamId(p);
      pushState({ programCamera: n ?? undefined, previewCamera: p ?? undefined });
      setIsFading(false);
    }, 600);
  }, [isFading, programCamId, previewCamId, pushState]);

  const handleToggleLive = useCallback(() => {
    const n = !isLive;
    setIsLive(n);
    pushState({ isLive: n });
  }, [isLive, pushState]);

  const sendCue = useCallback(() => {
    if (!directorCue.trim() || !hostId) return;
    cameras.filter(c => c.type === 'rtc' && c.peerId).forEach(c =>
      fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: hostId, to: c.peerId, action: 'cue', payload: { text: directorCue.trim() } }),
      }).catch(console.error)
    );
    setDirectorCue('');
  }, [directorCue, hostId, cameras]);

  useKeyboardShortcuts({
    onToggleLive: handleToggleLive,
    onCut: handleCut,
    onNextSlide: () => {},
    onPrevSlide: () => {},
    onBlack: () => pushState({ activeOverlay: 'bug_off' }),
    onClearOverlays: () => pushState({ activeMediaOverlays: [], activeOverlay: null }),
    onToggleLowerThird: () => {},
    onToggleCountdown: () => {},
    onBreakSlide: () => {
      const n = liveState?.activeOverlay === 'break' ? null : 'break';
      pushState({ activeOverlay: n });
    },
  });

  const programCam = cameras.find(c => c.id === programCamId);
  const previewCam = cameras.find(c => c.id === previewCamId);

  return (
    <StationShell station="director" connStatus={connStatus} isLive={isLive}>
      <div className="flex flex-col h-full p-4 gap-4">

        {/* ── TOP: DIRECTOR CUE BAR ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-black/60 rounded-xl px-4 py-2 border border-white/[0.08] flex-1">
            <input value={directorCue} onChange={e => setDirectorCue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendCue()}
              placeholder="SEND CUE TO CAMERA OPS..."
              className="bg-transparent text-[10px] outline-none flex-1 uppercase font-black tracking-widest placeholder-slate-800 text-white" />
            <button onClick={sendCue} className="text-slate-700 hover:text-sky-500 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <motion.button onClick={handleToggleLive} whileTap={{ scale: 0.96 }}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              isLive ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white'
                : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
            }`}>
            {isLive ? '● LIVE' : 'GO LIVE'}
          </motion.button>
        </div>

        {/* ── MONITOR QUADRANT ── */}
        <div className="flex-[1.6] flex gap-4 min-h-0">
          <ProgramMonitor
            type="preview" cam={previewCam} videoRef={previewVideoRef}
            outputMode={liveState?.outputMode ?? 'graphics'}
            activeAtmos={activeAtmos}
            activeSlide={liveState?.activeSlide ?? null}
            textPosition={liveState?.textPosition ?? 'center'}
            textStylePreset={liveState?.textStylePreset ?? 'clean_white'}
            textFontSize={liveState?.textFontSize ?? 'lg'}
            textFontFamily={(liveState?.textFontFamily as 'sans' | 'scripture') ?? 'sans'}
            activeOverlay={liveState?.activeOverlay ?? null}
            activeMediaOverlays={liveState?.activeMediaOverlays ?? []}
            overlayOpacities={{}} showBranding={liveState?.showBranding ?? false}
            isFading={false}
            lowerThirdText={liveState?.lowerThirdText ?? ''}
            lowerThirdSub={liveState?.lowerThirdSub ?? ''}
            lowerThirdStyle={liveState?.lowerThirdStyle ?? 'classic'}
            lowerThirdColor={liveState?.lowerThirdColor ?? '#6EC9FF'}
          />

          <TransitionPillar
            onCut={handleCut} onFade={handleFade} isFading={isFading}
            tBarValue={tBarValue} setTBarValue={setTBarValue}
          />

          <ProgramMonitor
            type="program" cam={programCam} videoRef={programVideoRef}
            outputMode={liveState?.outputMode ?? 'graphics'}
            activeAtmos={activeAtmos}
            activeSlide={liveState?.activeSlide ?? null}
            textPosition={liveState?.textPosition ?? 'center'}
            textStylePreset={liveState?.textStylePreset ?? 'clean_white'}
            textFontSize={liveState?.textFontSize ?? 'lg'}
            textFontFamily={(liveState?.textFontFamily as 'sans' | 'scripture') ?? 'sans'}
            activeOverlay={liveState?.activeOverlay ?? null}
            activeMediaOverlays={liveState?.activeMediaOverlays ?? []}
            overlayOpacities={{}} showBranding={liveState?.showBranding ?? false}
            isFading={isFading} isLive={isLive}
            lowerThirdText={liveState?.lowerThirdText ?? ''}
            lowerThirdSub={liveState?.lowerThirdSub ?? ''}
            lowerThirdStyle={liveState?.lowerThirdStyle ?? 'classic'}
            lowerThirdColor={liveState?.lowerThirdColor ?? '#6EC9FF'}
          />
        </div>

        {/* ── SOURCE BANK ── */}
        <div className="flex-1 min-h-0">
          <SourceBank
            cameras={cameras} programCamId={programCamId} previewCamId={previewCamId}
            channelLevels={{}}
            isCinematicMode={isCinematicMode} setIsCinematicMode={setIsCinematicMode}
            genesisPreset={genesisPreset} setGenesisPreset={setGenesisPreset}
            onSelectCamera={id => { setPreviewCamId(id); pushState({ previewCamera: id }); }}
            onOpenSettings={() => setShowCameraPanel(true)}
            isLoadingDevices={isLoadingDevices}
          />
        </div>
      </div>

      {/* ── CAMERA MANAGER MODAL ── */}
      {showCameraPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
    </StationShell>
  );
}

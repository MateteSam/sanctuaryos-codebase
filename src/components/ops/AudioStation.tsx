'use client';

/**
 * AudioStation — Full SONUS mixer station.
 *
 * Wraps the complete AudioWorkspace as a standalone operator station.
 * Manages its own camera connections for audio input and provides
 * the full mixer surface without needing the BroadcastShell.
 */

import { useState } from 'react';
import { useStationSync } from '@/lib/useStationSync';
import { useCameraManager } from '@/lib/useCameraManager';
import { useAudioEngine } from '@/lib/useAudioEngine';
import { SonusProWorkspace } from '@/components/broadcast/SonusProWorkspace';
import { StationShell } from './StationShell';

export function AudioStation() {
  const { liveState, connStatus } = useStationSync('audio');

  const { cameras } = useCameraManager();
  const {
    channels, channelLevels, buses, busLevels, clipping, peakHold, compGainReduction,
    masterVolume, setMasterVolume, masterMuted, setMasterMuted,
    autoMix, setAutoMix, autoDuck, setAutoDuck, audioContextState, broadcastStream,
    setChannelVolume, toggleChannelMute, toggleChannelSolo,
    setPreAmpGain, setChannelEQ, setHPFFreq, toggleGate, toggleComp,
    setChannelSend, setBusMasterLevel, toggleBusMute,
    dominantChannelId, togglePastorMic, setAuxSend,
    applyChannelPreset, addVirtualChannel,
  } = useAudioEngine(cameras);

  // Track whether the user has minimized the workspace header
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  return (
    <StationShell station="audio" connStatus={connStatus} isLive={liveState?.isLive}>
      <div className="h-full">
        <SonusProWorkspace
          channels={channels}
          channelLevels={channelLevels}
          clipping={clipping}
          peakHold={peakHold}
          buses={buses}
          busLevels={busLevels}
          autoMix={autoMix}
          setAutoMix={setAutoMix}
          autoDuck={autoDuck}
          setAutoDuck={setAutoDuck}
          compGainReduction={compGainReduction}
          audioContextState={audioContextState}
          broadcastStream={broadcastStream}
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
          onClose={() => {/* No-op in station mode — always visible */}}
        />
      </div>
    </StationShell>
  );
}

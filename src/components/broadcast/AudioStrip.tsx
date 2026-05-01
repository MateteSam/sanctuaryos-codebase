'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio, Headphones, Zap, Shield, Wand2, Disc3 } from 'lucide-react';
import { type AudioChannel, type AudioBus, type ChannelEQ, type AudioPresetId, AUDIO_PRESETS } from '@/lib/useAudioEngine';
import { PanKnob, DAWFader, VUBars, MSButton, CHAN_COLORS, BG_MAIN, BG_STRIP, BG_TRACK } from './daw-ui';

// ── Channel strip (matching reference image layout) ───────────────────────────
function ChannelStrip({ ch, idx, level, peak, clip, activeBusId,
  onVol, onMute, onSolo, onSend, onEQ, onPreset }: {
  ch: AudioChannel; idx: number; level: number; peak: number; clip: boolean;
  activeBusId: string;
  onVol: (v: number) => void; onMute: () => void; onSolo: () => void;
  onSend: (b: string, v: number) => void; onEQ: (e: Partial<ChannelEQ>) => void;
  onPreset: (p: AudioPresetId) => void;
}) {
  const [pan, setPan] = useState(0);
  const color = CHAN_COLORS[idx % CHAN_COLORS.length];
  const faderVal = activeBusId === 'foh' ? ch.volume : (ch.sends[activeBusId] ?? 0);
  const onFader  = (v: number) => activeBusId === 'foh' ? onVol(v) : onSend(activeBusId, v);
  const dBLabel  = faderVal < 0.001 ? '-∞' : `${(20 * Math.log10(faderVal)).toFixed(1)}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: 72, flexShrink: 0, borderRadius: 6,
      background: BG_STRIP,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>
      {/* Active color accent bar at top */}
      <div style={{ width: '100%', height: 2, background: color, flexShrink: 0 }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 6px 6px', width: '100%' }}>
        {/* Channel label + Magic Wand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2px' }}>
          <span style={{
            fontSize: 8, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}>
            {ch.label.slice(0, 6)}
          </span>
          <button onClick={() => {
            const keys = Object.keys(AUDIO_PRESETS) as AudioPresetId[];
            const next = keys[Math.floor(Math.random() * keys.length)]; // Random preset for now, or could cycle
            onPreset(next);
          }} style={{ color: color, opacity: 0.7, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }} title="Apply Magic Preset">
            <Wand2 size={10} />
          </button>
        </div>

        {/* Clip LED */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: clip ? '#ef4444' : 'rgba(255,255,255,0.1)',
          boxShadow: clip ? '0 0 6px #ef4444' : 'none',
          transition: 'all 0.1s',
        }} />

        {/* Pan knob */}
        <PanKnob value={pan} onChange={setPan} />

        {/* PAN label */}
        <span style={{ fontSize: 7, fontFamily: 'monospace', letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
          PAN
        </span>

        {/* Fader + VU area */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, width: '100%', height: 120 }}>
          <DAWFader value={faderVal} min={0} max={1.5} color={color} onChange={onFader} height={120} />
          <VUBars level={level} peakHold={peak} color={color} height={120} />
        </div>

        {/* dB readout */}
        <span style={{ fontSize: 7, fontFamily: 'monospace', color, letterSpacing: '0.05em' }}>
          {dBLabel} dB
        </span>

        {/* M / S buttons */}
        <div style={{ display: 'flex', gap: 3, width: '100%' }}>
          <MSButton label="M" active={ch.muted}  activeColor="#ef4444" onClick={onMute} />
          <MSButton label="S" active={ch.soloed} activeColor={color}   onClick={onSolo} />
        </div>
      </div>
    </div>
  );
}

// ── Master bus column ─────────────────────────────────────────────────────────
function MasterStrip({ bus, level, onLevel, onMute }: {
  bus: AudioBus; level: number; onLevel: (v: number) => void; onMute: () => void;
}) {
  const GOLD = '#f0c14b';
  const isMaster = bus.id === 'foh';
  const color = isMaster ? GOLD : bus.color;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: isMaster ? 86 : 70, flexShrink: 0, borderRadius: 6,
      background: isMaster ? '#23221a' : BG_STRIP,
      border: `1px solid ${isMaster ? 'rgba(240,193,75,0.25)' : 'rgba(255,255,255,0.06)'}`,
      boxShadow: isMaster ? '0 0 16px rgba(240,193,75,0.12)' : '0 2px 8px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', height: 2, background: color, flexShrink: 0,
        boxShadow: isMaster ? `0 0 8px ${GOLD}` : 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px', width: '100%' }}>
        {/* Label */}
        <span style={{
          fontSize: 8, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: isMaster ? GOLD : 'rgba(255,255,255,0.5)',
        }}>
          {bus.name}
        </span>

        {/* Bus type icon */}
        <span style={{ fontSize: 11 }}>
          {bus.type === 'foh' ? '🔊' : bus.type === 'broadcast' ? '📡' : '🎧'}
        </span>

        {/* Fader + VU */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, width: '100%', height: 120 }}>
          <DAWFader value={bus.masterLevel} min={0} max={1} color={color} onChange={onLevel} height={120} />
          {isMaster
            ? <div style={{ display: 'flex', gap: 2, height: 120 }}>
                <VUBars level={level} peakHold={level} color={GOLD} height={120} />
                <VUBars level={level * 0.95} peakHold={level} color={GOLD} height={120} />
              </div>
            : <VUBars level={level} peakHold={level} color={color} height={120} />
          }
        </div>

        {/* Level % */}
        <span style={{ fontSize: 7, fontFamily: 'monospace', color, letterSpacing: '0.05em' }}>
          {Math.round(bus.masterLevel * 100)}%
        </span>

        {/* Mute */}
        <MSButton label="MUTE" active={bus.muted} activeColor="#ef4444" onClick={onMute} />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  channels: AudioChannel[]; channelLevels: Record<string, number>;
  clipping: Record<string, boolean>; peakHold: Record<string, number>;
  buses: AudioBus[]; busLevels: Record<string, number>;
  autoMix: boolean; setAutoMix: (v: boolean) => void;
  autoDuck: boolean; setAutoDuck: (v: boolean) => void;
  audioContextState: AudioContextState; broadcastStream: MediaStream | null;
  setChannelVolume: (id: string, v: number) => void;
  toggleChannelMute: (id: string) => void; toggleChannelSolo: (id: string) => void;
  setChannelSend: (id: string, busId: string, v: number) => void;
  setPreAmpGain: (id: string, db: number) => void;
  setChannelEQ: (id: string, eq: Partial<ChannelEQ>) => void;
  toggleGate: (id: string) => void; toggleComp: (id: string) => void;
  setBusMasterLevel: (busId: string, v: number) => void; toggleBusMute: (busId: string) => void;
  applyChannelPreset?: (id: string, presetId: AudioPresetId) => void;
  addVirtualChannel?: (label: string, url: string) => void;
}

// ── Main mixer console ────────────────────────────────────────────────────────
export function AudioStrip(props: Props) {
  const { channels, channelLevels, clipping, peakHold, buses, busLevels,
    autoMix, setAutoMix, autoDuck, setAutoDuck, audioContextState, broadcastStream,
    setChannelVolume, toggleChannelMute, toggleChannelSolo, setChannelSend,
    setChannelEQ, setBusMasterLevel, toggleBusMute, applyChannelPreset, addVirtualChannel } = props;

  const [activeBusId, setActiveBusId] = useState('foh');
  if (!buses?.length) return null;
  const activeBus = buses.find(b => b.id === activeBusId) ?? buses[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
      background: BG_MAIN, borderRadius: 10, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>

      {/* ── TOP BAR: bus selector + engine controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.35)', flexShrink: 0, overflowX: 'auto' }}>

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%',
            background: audioContextState === 'running' ? '#4ade80' : '#ef4444',
            boxShadow: audioContextState === 'running' ? '0 0 6px #4ade80' : '0 0 6px #ef4444' }} />
          <span style={{ fontSize: 8, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            SONUS
          </span>
        </div>

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Bus tabs — styled like the "GRP 1" labels in the reference */}
        {buses.map(bus => (
          <button key={bus.id} onClick={() => setActiveBusId(bus.id)} style={{
            padding: '3px 10px', borderRadius: 4, flexShrink: 0, cursor: 'pointer',
            fontSize: 8, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            border: activeBusId === bus.id ? `1px solid ${bus.color}60` : '1px solid rgba(255,255,255,0.08)',
            background: activeBusId === bus.id ? `${bus.color}18` : 'rgba(255,255,255,0.04)',
            color: activeBusId === bus.id ? bus.color : 'rgba(255,255,255,0.35)',
            transition: 'all 0.15s',
          }}>
            {bus.name}
          </button>
        ))}

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Engine toggles */}
        {([['AUTO MIX', autoMix, () => setAutoMix(!autoMix), '#22d3ee'],
           ['DUCK',     autoDuck, () => setAutoDuck(!autoDuck), '#a855f7']] as const).map(([l, on, fn, c]) => (
          <button key={l} onClick={fn as () => void} style={{
            padding: '3px 8px', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
            fontSize: 8, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.1em',
            border: on ? `1px solid ${c}50` : '1px solid rgba(255,255,255,0.08)',
            background: on ? `${c}18` : 'rgba(255,255,255,0.04)',
            color: on ? c as string : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>
            {l}
          </button>
        ))}

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Stem test button */}
        {addVirtualChannel && (
          <button onClick={() => addVirtualChannel('Stem Ref', '/audio/test_stem.mp3')} style={{
            padding: '3px 8px', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
            fontSize: 8, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.1em',
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Disc3 size={10} /> + STEM
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Active bus label */}
        <span style={{ fontSize: 7, fontFamily: 'monospace', letterSpacing: '0.1em',
          color: activeBus.color, textTransform: 'uppercase', flexShrink: 0 }}>
          {activeBus.type === 'foh' ? 'FOH — MAIN PA' : activeBus.type === 'broadcast' ? 'BROADCAST' : `${activeBus.name} MONITOR`}
        </span>

        {broadcastStream && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            borderRadius: 4, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7',
              animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 7, fontWeight: 900, fontFamily: 'monospace',
              letterSpacing: '0.12em', color: '#a855f7' }}>REC READY</span>
          </div>
        )}
      </div>

      {/* ── MIXER SURFACE ── */}
      <div style={{
        flex: 1, display: 'flex', gap: 6, padding: '10px 10px 8px',
        overflowX: 'auto', minHeight: 0, alignItems: 'flex-start',
        background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 76px)`,
      }}>

        {/* Channel strips */}
        {channels.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0.3, 0.6, 0.45, 0.8].map((h, i) => (
                <div key={i} style={{ width: 72, height: 200, borderRadius: 6,
                  background: BG_STRIP, border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: 8, gap: 6 }}>
                  <div style={{ width: 8, height: `${h * 100}px`, background: `${CHAN_COLORS[i]}40`, borderRadius: 2 }} />
                  <div style={{ width: '100%', height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
              letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
              No Audio Sources
            </span>
          </div>
        ) : (
          channels.map((ch, i) => (
            <ChannelStrip key={ch.id} ch={ch} idx={i}
              level={channelLevels[ch.id] ?? 0}
              peak={peakHold[ch.id] ?? 0}
              clip={clipping[ch.id] ?? false}
              activeBusId={activeBusId}
              onVol={v => setChannelVolume(ch.id, v)}
              onMute={() => toggleChannelMute(ch.id)}
              onSolo={() => toggleChannelSolo(ch.id)}
              onSend={(b, v) => setChannelSend(ch.id, b, v)}
              onEQ={eq => setChannelEQ(ch.id, eq)}
              onPreset={p => applyChannelPreset?.(ch.id, p)} />
          ))
        )}

        {/* Separator */}
        {channels.length > 0 && (
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 2px' }} />
        )}

        {/* Bus masters (MASTER + aux) */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {buses.map(bus => (
            <MasterStrip key={bus.id} bus={bus}
              level={busLevels[bus.id] ?? 0}
              onLevel={v => setBusMasterLevel(bus.id, v)}
              onMute={() => toggleBusMute(bus.id)} />
          ))}
        </div>

      </div>
    </div>
  );
}

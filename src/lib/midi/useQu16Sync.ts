import { useEffect, useRef, useState, useCallback } from 'react';
import { Qu16Parser, buildQu16Nrpn, buildQu16Mute } from './Qu16Protocol';

export type HardwareState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Qu16State {
  status: HardwareState;
  rxActive: boolean;
  txActive: boolean;
  firmware: string;
}

export function useQu16Sync(midiChannel: number = 0) {
  const [state, setState] = useState<Qu16State>({
    status: 'disconnected',
    rxActive: false,
    txActive: false,
    firmware: 'Unknown',
  });

  const midiAccessRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const outputRef = useRef<any>(null);
  const parserRef = useRef(new Qu16Parser());
  
  // Throttle TX/RX indicators
  const rxTimer = useRef<any>(null);
  const txTimer = useRef<any>(null);

  const [lastMessage, setLastMessage] = useState<{type: string, channel: number, value: number} | null>(null);

  // Initialize Web MIDI API
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.error('[Qu16Sync] Web MIDI API not supported in this browser.');
      setState(s => ({ ...s, status: 'error' }));
      return;
    }

    let isMounted = true;
    setState(s => ({ ...s, status: 'connecting' }));

    navigator.requestMIDIAccess({ sysex: false }).then(
      (access: any) => {
        if (!isMounted) return;
        midiAccessRef.current = access;

        // Auto-connect to Qu-16 ports
        const connectPorts = () => {
          let foundIn = null;
          let foundOut = null;
          
          for (const input of access.inputs.values()) {
            if (input.name && input.name.includes('Qu-16')) foundIn = input;
          }
          for (const output of access.outputs.values()) {
            if (output.name && output.name.includes('Qu-16')) foundOut = output;
          }

          inputRef.current = foundIn;
          outputRef.current = foundOut;

          if (foundIn && foundOut) {
            setState(s => ({ ...s, status: 'connected' }));
            
            foundIn.onmidimessage = (message: any) => {
              if (!isMounted) return;
              
              // Flash RX indicator
              setState(s => ({ ...s, rxActive: true }));
              clearTimeout(rxTimer.current);
              rxTimer.current = setTimeout(() => setState(s => ({ ...s, rxActive: false })), 100);

              const parsed = parserRef.current.parse(message.data);
              if (parsed) {
                setLastMessage(parsed);
              }
            };
          } else {
            setState(s => ({ ...s, status: 'disconnected' }));
          }
        };

        connectPorts();
        access.onstatechange = connectPorts;
      },
      (err: any) => {
        console.error('[Qu16Sync] MIDI Access Denied:', err);
        if (isMounted) setState(s => ({ ...s, status: 'error' }));
      }
    );

    return () => {
      isMounted = false;
      if (inputRef.current) inputRef.current.onmidimessage = null;
    };
  }, []);

  // API to control the desk
  const setFader = useCallback((quChannelMsb: number, value: number) => {
    if (!outputRef.current) return;
    
    // Flash TX indicator
    setState(s => ({ ...s, txActive: true }));
    clearTimeout(txTimer.current);
    txTimer.current = setTimeout(() => setState(s => ({ ...s, txActive: false })), 100);

    const payload = buildQu16Nrpn(midiChannel, quChannelMsb, 0x11, value); // 0x11 = Fader
    outputRef.current.send(payload);
  }, [midiChannel]);

  const setMute = useCallback((quChannelMsb: number, isMuted: boolean) => {
    if (!outputRef.current) return;
    
    setState(s => ({ ...s, txActive: true }));
    clearTimeout(txTimer.current);
    txTimer.current = setTimeout(() => setState(s => ({ ...s, txActive: false })), 100);

    const payload = buildQu16Mute(midiChannel, quChannelMsb, isMuted);
    outputRef.current.send(payload);
  }, [midiChannel]);

  const setEQ = useCallback((quChannelMsb: number, paramLsb: number, floatValue: number) => {
    if (!outputRef.current) return;
    
    setState(s => ({ ...s, txActive: true }));
    clearTimeout(txTimer.current);
    txTimer.current = setTimeout(() => setState(s => ({ ...s, txActive: false })), 100);

    const payload = buildQu16Nrpn(midiChannel, quChannelMsb, paramLsb, floatValue);
    outputRef.current.send(payload);
  }, [midiChannel]);

  return {
    state,
    lastMessage,
    setFader,
    setMute,
    setEQ
  };
}

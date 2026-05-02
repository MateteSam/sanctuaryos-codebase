/**
 * Allen & Heath Qu-16 MIDI Protocol Definitions
 * Uses NRPN (Non-Registered Parameter Number) for deep DSP control.
 * 
 * NRPN Sequence:
 * 1. CC 99 (MSB) -> Channel Selection
 * 2. CC 98 (LSB) -> Parameter ID Selection
 * 3. CC 6  (Data MSB) -> Value (Coarse)
 * 4. CC 38 (Data LSB) -> Value (Fine)
 */

export const QU_CC = {
  NRPN_MSB: 99,
  NRPN_LSB: 98,
  DATA_MSB: 6,
  DATA_LSB: 38,
};

// CC99 (MSB) - Mixer Channels
export const QU_CHANNELS = {
  CH_1: 0x00, CH_2: 0x01, CH_3: 0x02, CH_4: 0x03,
  CH_5: 0x04, CH_6: 0x05, CH_7: 0x06, CH_8: 0x07,
  CH_9: 0x08, CH_10: 0x09, CH_11: 0x0A, CH_12: 0x0B,
  CH_13: 0x0C, CH_14: 0x0D, CH_15: 0x0E, CH_16: 0x0F,
  ST_1: 0x10, ST_2: 0x11, ST_3: 0x12,
  FX_RET_1: 0x13, FX_RET_2: 0x14, FX_RET_3: 0x15, FX_RET_4: 0x16,
  MIX_1: 0x18, MIX_2: 0x19, MIX_3: 0x1A, MIX_4: 0x1B,
  LR_MASTER: 0x20,
};

// CC98 (LSB) - DSP Parameters
export const QU_PARAMS = {
  PAN: 0x10,           // 16
  FADER_LEVEL: 0x11,   // 17
  MUTE: 0x12,          // 18 (0x00 = Unmuted, 0x01 = Muted)
  HPF_FREQ: 0x15,      // 21
  EQ_LOW_FREQ: 0x1A,   // 26
  EQ_LOW_GAIN: 0x1B,   // 27
  EQ_LM_FREQ: 0x1E,    // 30
  EQ_LM_GAIN: 0x1F,    // 31
  EQ_HM_FREQ: 0x22,    // 34
  EQ_HM_GAIN: 0x23,    // 35
  EQ_HIGH_FREQ: 0x26,  // 38
  EQ_HIGH_GAIN: 0x27,  // 39
  COMP_THRESH: 0x3D,   // 61
  COMP_RATIO: 0x3E,    // 62
  COMP_GAIN: 0x41,     // 65 (Makeup Gain)
};

/**
 * Generates the MIDI bytes required to send an NRPN message to the Qu-16.
 * Expects value to be 0.0 to 1.0, which scales to the 14-bit (0-16383) Linear Taper range.
 */
export function buildQu16Nrpn(midiChannel: number, quChannelMsb: number, paramLsb: number, floatValue: number): Uint8Array {
  // Clamp value
  const val = Math.max(0, Math.min(1, floatValue));
  
  // Convert to 14-bit integer (16384 steps)
  const int14 = Math.round(val * 16383);
  const dataMsb = (int14 >> 7) & 0x7F; // Top 7 bits
  const dataLsb = int14 & 0x7F;        // Bottom 7 bits
  
  // MIDI Control Change status byte: 0xB0 + (channel 0-15)
  // Qu-16 defaults to MIDI Channel 1, which is 0x00 internally.
  const status = 0xB0 | (midiChannel & 0x0F);
  
  return new Uint8Array([
    status, QU_CC.NRPN_MSB, quChannelMsb,
    status, QU_CC.NRPN_LSB, paramLsb,
    status, QU_CC.DATA_MSB, dataMsb,
    status, QU_CC.DATA_LSB, dataLsb
  ]);
}

/**
 * Builds a simple Mute On/Off message (only uses MSB for value).
 */
export function buildQu16Mute(midiChannel: number, quChannelMsb: number, isMuted: boolean): Uint8Array {
  const status = 0xB0 | (midiChannel & 0x0F);
  const val = isMuted ? 0x01 : 0x00;
  
  return new Uint8Array([
    status, QU_CC.NRPN_MSB, quChannelMsb,
    status, QU_CC.NRPN_LSB, QU_PARAMS.MUTE,
    status, QU_CC.DATA_MSB, val,
    status, QU_CC.DATA_LSB, 0x00 // LSB ignored for mute but good practice to complete sequence
  ]);
}

/**
 * Simple NRPN Parser to convert raw MIDI bytes from the physical desk into logical state updates.
 * (State machine needed since NRPN arrives as sequential CC messages).
 */
export class Qu16Parser {
  private activeMsb: number = -1;
  private activeLsb: number = -1;
  private activeDataMsb: number = -1;

  public parse(data: Uint8Array): { type: string, channel: number, value: number } | null {
    if (data.length < 3) return null;
    
    // Status byte must be a CC message (0xB0 to 0xBF)
    if ((data[0] & 0xF0) !== 0xB0) return null;

    const cc = data[1];
    const val = data[2];

    if (cc === QU_CC.NRPN_MSB) {
      this.activeMsb = val;
    } else if (cc === QU_CC.NRPN_LSB) {
      this.activeLsb = val;
    } else if (cc === QU_CC.DATA_MSB) {
      this.activeDataMsb = val;
      // For Mute, the command completes at MSB.
      if (this.activeLsb === QU_PARAMS.MUTE && this.activeMsb !== -1) {
        return { type: 'MUTE', channel: this.activeMsb, value: val };
      }
    } else if (cc === QU_CC.DATA_LSB) {
      if (this.activeMsb !== -1 && this.activeLsb !== -1 && this.activeDataMsb !== -1) {
        // Reconstruct 14-bit value
        const int14 = (this.activeDataMsb << 7) | val;
        const floatValue = int14 / 16383.0;
        
        let type = 'UNKNOWN';
        if (this.activeLsb === QU_PARAMS.FADER_LEVEL) type = 'FADER';
        else if (this.activeLsb === QU_PARAMS.PAN) type = 'PAN';
        
        const result = { type, channel: this.activeMsb, value: floatValue };
        
        // Reset state
        this.activeMsb = -1; this.activeLsb = -1; this.activeDataMsb = -1;
        return result;
      }
    }
    
    return null;
  }
}

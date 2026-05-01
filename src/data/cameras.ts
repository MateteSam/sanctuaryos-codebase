export type CameraSourceType = 'local' | 'usb' | 'rtc' | 'placeholder';

export interface CameraSource {
  id: string;
  name: string;
  label: string;
  color: string;           // Tailwind gradient for placeholder/fallback display
  status: 'live' | 'preview' | 'standby' | 'connecting' | 'disconnected';
  type: CameraSourceType;
  deviceId?: string;       // MediaDeviceInfo.deviceId for local/USB cameras
  peerId?: string;         // Remote peer ID for WebRTC clients
  connected: boolean;
  resolution?: string;     // e.g. "1920x1080"
  latency?: number;        // ms, for RTC sources
  orientation?: 'portrait' | 'landscape';  // phone camera orientation
}

/** Static placeholder cameras — supplemented at runtime by useCameraManager */
export const defaultCameras: CameraSource[] = [
  {
    id: 'cam-local',
    name: 'LOCAL',
    label: 'This Device',
    color: 'from-sky-900 to-slate-900',
    status: 'standby',
    type: 'local',
    connected: false,
  },
  {
    id: 'cam2',
    name: 'CAM 2',
    label: 'External Source',
    color: 'from-zinc-800 to-zinc-950',
    status: 'standby',
    type: 'placeholder',
    connected: false,
  },
  {
    id: 'cam3',
    name: 'CAM 3',
    label: 'External Source',
    color: 'from-neutral-700 to-neutral-950',
    status: 'standby',
    type: 'placeholder',
    connected: false,
  },
  {
    id: 'cam4',
    name: 'CAM 4',
    label: 'External Source',
    color: 'from-stone-700 to-stone-950',
    status: 'standby',
    type: 'placeholder',
    connected: false,
  },
];

/** Legacy alias so existing imports keep working */
export const cameras = defaultCameras;

export const overlayGraphics = [
  { id: 'lower_thirds', label: 'Lower Thirds', icon: 'AlignLeft' },
  { id: 'going_live',   label: 'Going Live', icon: 'Radio' },
  { id: 'break',        label: 'Be Right Back', icon: 'Clock' },
  { id: 'social',       label: 'Social Bar', icon: 'Share2' },
  { id: 'bug',          label: 'Station Bug', icon: 'Shield' },
  { id: 'bug_off',      label: 'Clear Graphics', icon: 'X' },
];


'use client';

import { useState, useCallback } from 'react';
import { Users, Shield, Cpu, Zap, Link as LinkIcon, Download, Camera, Wifi, ScanLine } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

// ── helpers ──────────────────────────────────────────────────────────────────
function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  return stored !== null ? stored === 'true' : fallback;
}

function pushState(patch: Record<string, unknown>) {
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(console.error);
}

export function SettingsView() {
  // Persist toggles to localStorage + broadcast via /api/state
  const [autoAccept, setAutoAccept] = useState<boolean>(() => readBool('sos:autoAccept', true));
  const [showCamLabel, setShowCamLabel] = useState<boolean>(() => readBool('sos:showCamLabel', true));
  const [pairingPort, setPairingPort] = useState('3000');

  const toggleAutoAccept = useCallback(() => {
    setAutoAccept(prev => {
      const next = !prev;
      localStorage.setItem('sos:autoAccept', String(next));
      pushState({ autoAccept: next });
      return next;
    });
  }, []);

  const toggleShowCamLabel = useCallback(() => {
    setShowCamLabel(prev => {
      const next = !prev;
      localStorage.setItem('sos:showCamLabel', String(next));
      pushState({ showCamLabel: next });
      return next;
    });
  }, []);

  return (
    <section>
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="System Configuration"
          title="Platform Settings"
          description="Manage your team, customize hardware defaults, and configure global OS preferences."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" /> Account & Team Management
            </h4>
            <div className="rounded-[20px] border border-white/10 bg-slate-900/50 p-5 space-y-4">
               
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    AT
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Admin Team</p>
                    <p className="text-xs text-slate-400">Owner • admin@sanctuaryos.com</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-sky-400 hover:text-sky-300">Manage</button>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Active Volunteers</p>
                <div className="space-y-2">
                  {[
                    { name: 'Sarah J.', role: 'Visuals Director', access: 'Full Access' },
                    { name: 'Marcus T.', role: 'FOH Operator', access: 'Live Control Only' }
                  ].map((user, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                      </div>
                      <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-1 rounded-md">{user.access}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-3 text-xs font-medium text-sky-400 hover:text-sky-300">+ Invite Team Member</button>
              </div>

            </div>

            <div className="rounded-[20px] border border-white/10 bg-slate-900/50 p-5">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                 <Shield className="h-4 w-4 text-emerald-400" /> Security & Access
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-400">Add an extra layer of security to your organization.</p>
                </div>
                <button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                  Enable
                </button>
              </div>
            </div>

            {/* Camera & Sources settings */}
            <div className="rounded-[20px] border border-white/10 bg-slate-900/50 p-5 space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Camera className="h-4 w-4 text-sky-400" /> Camera &amp; Sources
              </h4>

              {/* WiFi pairing port */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">WiFi Pairing Port</p>
                  <p className="text-xs text-slate-400">Used in the phone camera QR code URL.</p>
                </div>
                <input
                  type="number"
                  value={pairingPort}
                  onChange={e => setPairingPort(e.target.value)}
                  className="w-20 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500 text-right"
                />
              </div>

              {/* Auto-accept toggle */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Auto-Accept Phone Cameras</p>
                    <p className="text-xs text-slate-400">Connect phones automatically when they scan the QR code.</p>
                  </div>
                </div>
                <button
                  onClick={toggleAutoAccept}
                  aria-label={autoAccept ? 'Disable auto-accept' : 'Enable auto-accept'}
                  className={`h-5 w-9 rounded-full relative transition-colors ${
                    autoAccept ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${
                    autoAccept ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Show camera label toggle */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Show Camera Labels on Output</p>
                    <p className="text-xs text-slate-400">Display the source name on the program monitor.</p>
                  </div>
                </div>
                <button
                  onClick={toggleShowCamLabel}
                  aria-label={showCamLabel ? 'Hide camera labels' : 'Show camera labels'}
                  className={`h-5 w-9 rounded-full relative transition-colors ${
                    showCamLabel ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${
                    showCamLabel ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" /> Sovereign Hardware Globals
            </h4>
            
            <div className="rounded-[20px] border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-slate-900/60 p-5 flex flex-col gap-5">
              
              <div>
                <label className="text-sm font-medium text-slate-200 block mb-1">Default Projection Mode</label>
                <p className="text-xs text-slate-400 mb-3">The fallback mode for the Sanctuary Beam when entering an unmapped room.</p>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-sky-500/20 border border-sky-400 text-sky-300 text-xs py-2 rounded-lg font-medium">Volumetric</button>
                  <button className="bg-slate-950 border border-white/10 text-slate-400 hover:text-slate-200 text-xs py-2 rounded-lg transition text-center px-1">Mesh-Based</button>
                  <button className="bg-slate-950 border border-white/10 text-slate-400 hover:text-slate-200 text-xs py-2 rounded-lg transition text-center px-1">Wall Map</button>
                </div>
              </div>

              <div className="border-t border-white/5 pt-5">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <Zap className="h-4 w-4 text-amber-400" />
                     <p className="text-sm font-medium text-slate-200">Eco-Power Mode</p>
                   </div>
                   <div className="h-5 w-9 rounded-full bg-emerald-500 relative cursor-pointer">
                     <div className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white"></div>
                   </div>
                 </div>
                 <p className="text-xs text-slate-400">Automatically dim Beams to 70% brightness when the internal battery drops below 30%.</p>
              </div>

              <div className="border-t border-white/5 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">Firmware Updates</p>
                  <p className="text-xs text-slate-400">Current Version: OS v2.4.1</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                  <Download className="h-3 w-3" /> Check
                </button>
              </div>
            </div>

            <div className="mt-auto rounded-[20px] bg-white/5 border border-white/10 p-5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <LinkIcon className="h-5 w-5 text-slate-400" />
                 <div>
                   <p className="text-sm font-medium text-slate-200">ProPresenter Integration</p>
                   <p className="text-xs text-slate-400">Not connected</p>
                 </div>
               </div>
               <button className="text-xs font-medium text-sky-400 hover:text-sky-300">Connect</button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Clock, Radio } from 'lucide-react';

interface LiveState {
  room: string;
  atmosphere: string;
  flowMode: boolean;
  activeSlide: any;
  nextSlide: any;
  lastUpdated: number;
}

export function StageClient() {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const apiInterval = setInterval(() => {
      fetch('/api/state')
        .then((res) => res.json())
        .then((data) => setLiveState(data as LiveState))
        .catch(console.error);
    }, 500);

    const clockInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(clockInterval);
    };
  }, []);

  if (!liveState) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-xl font-bold uppercase tracking-widest text-slate-800 animate-pulse">Awaiting Signal</p>
      </div>
    );
  }

  const { activeSlide, nextSlide, flowMode } = liveState;

  return (
    <div className="flex h-full w-full flex-col bg-black text-white p-6 font-sans justify-between">
      
      {/* Header Bar */}
      <div className="flex justify-between items-start border-b border-white/20 pb-4">
         <div className="flex items-center gap-6">
           <p className="text-4xl font-bold font-mono tracking-tighter text-amber-400">{time}</p>
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${flowMode ? 'border-sanctuary text-halo bg-sanctuary/20' : 'border-white/20 text-slate-400'}`}>
             <Radio className="h-4 w-4" />
             <span className="text-sm font-bold uppercase tracking-widest">{flowMode ? 'Flow Mode' : 'Standard'}</span>
           </div>
         </div>
         <div className="text-right">
           <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Current Atmosphere</p>
           <p className="text-xl font-medium text-atmos">{liveState.atmosphere}</p>
         </div>
      </div>

      {/* Main Stage View */}
      <div className="flex-1 flex flex-col justify-center gap-12 py-8">
         <div className="flex-1 flex flex-col justify-end">
           {activeSlide ? (
             <div>
                {activeSlide.type === 'scripture' && (
                  <p className="text-halo text-2xl font-bold uppercase tracking-widest mb-4">{activeSlide.reference}</p>
                )}
                <p className="text-7xl font-bold leading-[1.2] whitespace-pre-wrap ${activeSlide.type === 'scripture' ? 'font-scripture tracking-normal' : 'tracking-tight'}">
                  {activeSlide.content}
                </p>
             </div>
           ) : (
             <p className="text-5xl font-bold text-slate-800 uppercase tracking-widest">Logo / Atmos</p>
           )}
         </div>

         <div className="h-px w-full bg-white/10" />

         <div className="flex-1 flex flex-col justify-start">
           <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-white/10 text-white text-sm font-bold uppercase tracking-widest rounded">Next</div>
             {nextSlide && nextSlide.type === 'scripture' && (
               <p className="text-halo text-lg font-bold uppercase tracking-widest">{nextSlide.reference}</p>
             )}
           </div>
           {nextSlide ? (
             <p className={`text-4xl font-medium leading-[1.3] whitespace-pre-wrap text-slate-400 ${nextSlide.type === 'scripture' ? 'font-scripture' : ''}`}>
               {nextSlide.content}
             </p>
           ) : (
             <p className="text-3xl font-bold text-slate-800 uppercase tracking-widest">End of Setlist</p>
           )}
         </div>
      </div>

    </div>
  );
}

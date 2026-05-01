'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Play, Timer, Film,
  Megaphone, BookOpen, AlignLeft, Image, Music, Square, Coffee,
  Sun, Moon, Zap, HandHeart, CheckCircle2, LayoutTemplate, X,
  ArrowRight, Clock
} from 'lucide-react';
import {
  type AnyServiceSlide, type ServiceSlideType,
  SLIDE_TYPE_META, SERVICE_TEMPLATES, instantiateTemplate,
  saveCustomTemplate, getCustomTemplates
} from '@/data/serviceTemplates';

// ── Map icon name strings → Lucide components ──────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Music, BookOpen, Film, Timer, Megaphone, HandHeart, AlignLeft,
  Image, Square, Coffee, Sun, Moon, Zap,
};

function SlideIcon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const Icon = ICON_MAP[name] || Square;
  return <Icon className={className ?? 'w-3.5 h-3.5'} style={color ? { color } : undefined} />;
}

function TemplateIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] || LayoutTemplate;
  return <Icon className="w-4 h-4" />;
}

// ── Live running countdown shown inside the slide card ─────────────────────
function CountdownTimer({ endTime, message }: { endTime: number; message: string }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, endTime - Date.now())), 1000);
    return () => clearInterval(t);
  }, [endTime]);
  const s = Math.floor(remaining / 1000) % 60;
  const m = Math.floor(remaining / 60000) % 60;
  const h = Math.floor(remaining / 3600000);
  const fmt = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <Clock className="w-3 h-3 text-violet-400 shrink-0" />
      <span className="font-mono text-sm font-black text-violet-300">{fmt}</span>
      {message && <span className="text-[10px] text-slate-500 truncate">{message}</span>}
    </div>
  );
}

// ── Add-slide form ─────────────────────────────────────────────────────────
const TYPE_LABELS: ServiceSlideType[] = [
  'announcement', 'countdown', 'prayer_point', 'sermon_outline',
  'scripture', 'lyric', 'sting', 'slideshow', 'break', 'blank',
];

interface AddSlideFormProps {
  accentColor: string;
  onAdd: (slide: AnyServiceSlide) => void;
  onCancel: () => void;
}

function AddSlideForm({ accentColor, onAdd, onCancel }: AddSlideFormProps) {
  const [addType, setAddType] = useState<ServiceSlideType>('announcement');
  const [form, setForm] = useState({
    title: '', body: '', points: '', imageUrl: '', videoUrl: '',
    message: 'Service begins soon…', minutesBefore: 10,
    topic: '', preacher: '', intervalSec: 5, cameraCue: '',
  });

  const handleAdd = () => {
    const now = Date.now();
    const base = { id: `svc-${now}`, title: form.title || SLIDE_TYPE_META[addType].label, cameraCue: form.cameraCue || undefined };
    let slide: AnyServiceSlide;
    switch (addType) {
      case 'countdown':
        slide = { ...base, type: 'countdown', endTime: now + form.minutesBefore * 60_000, message: form.message } as any;
        break;
      case 'announcement':
        slide = { ...base, type: 'announcement', body: form.body, imageUrl: form.imageUrl || undefined } as any;
        break;
      case 'prayer_point':
        slide = { ...base, type: 'prayer_point', points: form.points.split('\n').filter(Boolean) } as any;
        break;
      case 'sermon_outline':
        slide = { ...base, type: 'sermon_outline', topic: form.topic || form.title, preacher: form.preacher, points: form.points.split('\n').filter(Boolean).map(h => ({ heading: h })) } as any;
        break;
      case 'slideshow':
        slide = { ...base, type: 'slideshow', images: form.imageUrl.split('\n').filter(Boolean).map(url => ({ url })), intervalSec: form.intervalSec } as any;
        break;
      case 'sting':
        slide = { ...base, type: 'sting', style: 'opening', videoUrl: form.videoUrl || undefined } as any;
        break;
      default:
        slide = { ...base, type: addType } as any;
    }
    onAdd(slide);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden border-b border-white/[0.06] bg-black/30 shrink-0"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Add Slide</p>
          <button onClick={onCancel} className="text-slate-600 hover:text-slate-300 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Type selector */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Slide Type</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TYPE_LABELS.map(t => {
              const meta = SLIDE_TYPE_META[t];
              const isSelected = addType === t;
              return (
                <button key={t} onClick={() => setAddType(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/[0.06] text-slate-500 hover:border-white/15 hover:text-slate-300'
                  }`}>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: meta.color + (isSelected ? '30' : '15') }}>
                    <SlideIcon name={meta.iconName} className="w-3 h-3" color={meta.color} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">{meta.label}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" style={{ color: meta.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Camera Cue */}
        <div className="flex gap-2">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={`${SLIDE_TYPE_META[addType].label} title…`}
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
          <input value={form.cameraCue} onChange={e => setForm(f => ({ ...f, cameraCue: e.target.value }))}
            placeholder="Camera Queue (e.g. Pastor)" title="Type camera name to auto-switch when pushed"
            className="w-32 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
        </div>

        {/* Type-specific fields */}
        {addType === 'countdown' && (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-1 w-28 shrink-0">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Minutes</label>
                <input type="number" value={form.minutesBefore} min={1} max={600}
                  onChange={e => setForm(f => ({ ...f, minutesBefore: +e.target.value }))}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Display Message</label>
                <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Service begins soon…"
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
              </div>
            </div>
          </div>
        )}

        {addType === 'announcement' && (
          <div className="space-y-2">
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Announcement text shown on screen…" rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 resize-none transition" />
            <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="Background image URL (optional)"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
          </div>
        )}

        {(addType === 'prayer_point' || addType === 'sermon_outline') && (
          <div className="space-y-2">
            {addType === 'sermon_outline' && (
              <div className="flex gap-2">
                <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Sermon topic / title"
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
                <input value={form.preacher} onChange={e => setForm(f => ({ ...f, preacher: e.target.value }))}
                  placeholder="Preacher"
                  className="w-28 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
              </div>
            )}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">
                {addType === 'prayer_point' ? 'Prayer Points' : 'Outline Points'} — one per line
              </label>
              <textarea value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
                placeholder={addType === 'prayer_point' ? 'Thanksgiving\nHoly Spirit come\nOpen our hearts' : 'Point 1\nPoint 2\nPoint 3'} rows={4}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 resize-none transition" />
            </div>
          </div>
        )}

        {addType === 'sting' && (
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">Video URL (mp4/webm — optional)</label>
            <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://…/sting.mp4"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 transition" />
          </div>
        )}

        {addType === 'slideshow' && (
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1 block">Image URLs — one per line</label>
            <textarea value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://…/slide1.jpg&#10;https://…/slide2.jpg" rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/30 resize-none transition" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition"
            style={{ background: accentColor, color: '#0a0e1a' }}>
            <Plus className="w-3.5 h-3.5" /> Add to Flow
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:text-white border border-white/10 hover:border-white/20 transition">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Template picker panel ──────────────────────────────────────────────────
interface TemplatePanelProps {
  accentColor: string;
  onLoad: (id: string) => void;
  onClose: () => void;
}

function TemplatePanel({ accentColor, onLoad, onClose }: TemplatePanelProps) {
  const [customs, setCustoms] = useState<any[]>([]);
  useEffect(() => { setCustoms(getCustomTemplates()); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden border-b border-white/[0.06] bg-black/30 shrink-0"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Load a Template</p>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500">Instantly populate your service flow with a pre-built structure. You can edit or delete any slide afterwards.</p>
        <div className="space-y-2">
          {[...SERVICE_TEMPLATES, ...customs].map(t => (
            <button key={t.id} onClick={() => onLoad(t.id)}
              className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-white transition"
                style={{ background: accentColor + '15', borderColor: accentColor + '30' }}>
                <TemplateIcon name={t.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white group-hover:text-white leading-tight">{t.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
                <p className="text-[9px] text-slate-700 mt-1.5 font-black uppercase tracking-wider">{t.slides.length} slides</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 shrink-0 mt-2.5 transition" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ServiceFlow Component ─────────────────────────────────────────────
interface ServiceFlowProps {
  accentColor: string;
  onPushSlide: (slide: AnyServiceSlide) => void;
}

export function ServiceFlow({ accentColor, onPushSlide }: ServiceFlowProps) {
  const [slides, setSlides] = useState<AnyServiceSlide[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [panel, setPanel] = useState<'none' | 'template' | 'add'>('none');

  const openTemplate = () => setPanel(p => p === 'template' ? 'none' : 'template');
  const openAdd = () => setPanel(p => p === 'add' ? 'none' : 'add');
  const closePanel = () => setPanel('none');

  const handleLoadTemplate = (id: string) => {
    const custom = getCustomTemplates().find(c => c.id === id);
    if (custom) {
      // Materialize custom templates same as builtin
      const now = Date.now();
      const loaded = custom.slides.map((s, i) => {
        const base = { id: `svc-${now}-${i}`, title: s.title || 'Slide', cameraCue: s.cameraCue };
        if (s.type === 'countdown') return { ...s, ...base, endTime: now + ((s as any).durationMs ?? 600_000) } as AnyServiceSlide;
        return { ...s, ...base } as AnyServiceSlide;
      });
      setSlides(loaded);
    } else {
      const loaded = instantiateTemplate(id);
      setSlides(loaded);
    }
    setActiveIdx(-1);
    closePanel();
  };

  const handleSavePreset = () => {
    if (slides.length === 0) return;
    const name = prompt("Enter a name for this Custom Preset:");
    if (!name) return;
    saveCustomTemplate(name, slides);
    alert("Saved! You can find it in Templates.");
  };

  const handleAddSlide = (slide: AnyServiceSlide) => {
    setSlides(prev => [...prev, slide]);
    closePanel();
  };

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...slides];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setSlides(arr);
    if (activeIdx === idx) setActiveIdx(to);
  };

  const remove = (idx: number) => {
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (activeIdx === idx) setActiveIdx(-1);
  };

  const push = (slide: AnyServiceSlide, idx: number) => {
    setActiveIdx(idx);
    onPushSlide(slide);
  };

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex-1">
          Service Flow {slides.length > 0 && <span className="ml-1.5 text-slate-700">• {slides.length} slides</span>}
        </span>
        <button onClick={openTemplate}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition ${
            panel === 'template' ? 'border-white/30 bg-white/10 text-white' : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
          }`}>
          <LayoutTemplate className="w-3 h-3" /> Templates
        </button>
        {slides.length > 0 && (
          <button onClick={handleSavePreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition">
            Save Preset
          </button>
        )}
        <button onClick={openAdd}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
            panel === 'add' ? 'text-white' : ''
          }`}
          style={{ background: accentColor + (panel === 'add' ? 'ff' : '22'), border: `1px solid ${accentColor}${panel === 'add' ? 'ff' : '44'}`, color: panel === 'add' ? '#0a0e1a' : accentColor }}>
          <Plus className="w-3 h-3" /> Add Slide
        </button>
      </div>

      {/* ── Sliding panels ── */}
      <AnimatePresence>
        {panel === 'template' && (
          <TemplatePanel accentColor={accentColor} onLoad={handleLoadTemplate} onClose={closePanel} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panel === 'add' && (
          <AddSlideForm accentColor={accentColor} onAdd={handleAddSlide} onCancel={closePanel} />
        )}
      </AnimatePresence>

      {/* ── Slide list ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-0">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3 opacity-40">
            <LayoutTemplate className="w-8 h-8 text-slate-600" />
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest text-slate-600">Empty service flow</p>
              <p className="text-[10px] text-slate-700 mt-1">Use Templates to load a full service, or Add Slide to build your own</p>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={openTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/10 text-slate-500 hover:text-white hover:border-white/25 transition">
                <LayoutTemplate className="w-3 h-3" /> Load Template
              </button>
              <button onClick={openAdd}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                style={{ background: accentColor + '20', border: `1px solid ${accentColor}40`, color: accentColor }}>
                <Plus className="w-3 h-3" /> Add Slide
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {slides.map((slide, idx) => {
              const meta = SLIDE_TYPE_META[slide.type];
              const isActive = idx === activeIdx;
              return (
                <motion.div key={slide.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`group relative flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-white/[0.06] shadow-lg'
                      : 'border-white/[0.04] bg-white/[0.015] hover:border-white/10'
                  }`}
                  style={isActive ? { borderColor: accentColor + '50', boxShadow: `0 0 18px ${accentColor}15` } : {}}>

                  {/* Active indicator left bar */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: accentColor }} />
                  )}

                  {/* Slide number */}
                  <span className="text-[9px] font-black text-slate-700 w-4 shrink-0 text-right">{idx + 1}</span>

                  {/* Type icon badge */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: meta.color + '18', border: `1px solid ${meta.color}35` }}>
                    <SlideIcon name={meta.iconName} className="w-3.5 h-3.5" color={meta.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-white truncate">{slide.title}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest shrink-0 opacity-60"
                        style={{ color: meta.color }}>{meta.label}</span>
                    </div>

                    {/* Sub-line previews */}
                    {slide.type === 'countdown' && (slide as any).endTime && (
                      <CountdownTimer endTime={(slide as any).endTime} message={(slide as any).message} />
                    )}
                    {slide.type === 'announcement' && (slide as any).body && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{(slide as any).body}</p>
                    )}
                    {slide.type === 'prayer_point' && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{((slide as any).points ?? []).length} prayer points</p>
                    )}
                    {slide.type === 'sermon_outline' && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{(slide as any).topic}</p>
                    )}
                    {slide.type === 'sermon_outline' && (slide as any).preacher && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{(slide as any).preacher}</p>
                    )}
                    {slide.cameraCue && (
                      <div className="flex items-center gap-1 mt-1 text-[8px] font-black uppercase tracking-widest text-sky-400/80">
                        <Film className="w-2.5 h-2.5" /> AUTO-CUT: {slide.cameraCue}
                      </div>
                    )}
                  </div>

                  {/* Reorder + delete (visible on hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-20 transition">
                      <ChevronUp className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-20 transition">
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    <button onClick={() => remove(idx)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/15 transition">
                      <Trash2 className="w-3 h-3 text-red-500/50 group-hover:text-red-400 transition" />
                    </button>
                  </div>

                  {/* Push to Beam button */}
                  <button onClick={() => push(slide, idx)}
                    title="Push to Beam"
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition shrink-0"
                    style={{
                      background: isActive ? accentColor : 'rgba(255,255,255,0.04)',
                      color: isActive ? '#0a0e1a' : '#64748b',
                    }}>
                    <Play className="w-3.5 h-3.5" fill={isActive ? '#0a0e1a' : 'none'} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer hint ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.04] shrink-0">
        <p className="text-[9px] text-slate-700 font-mono">
          {slides.length > 0 ? `${activeIdx >= 0 ? activeIdx + 1 : '—'} / ${slides.length} active` : 'No slides'}
        </p>
        <p className="text-[9px] text-slate-700 font-mono">→ next  ·  ← prev  ·  Space cut</p>
      </div>
    </div>
  );
}

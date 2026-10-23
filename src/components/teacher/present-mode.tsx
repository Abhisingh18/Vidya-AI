'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, StickyNote } from 'lucide-react';
import { revealSteps, type SlidesContent } from '@/lib/teacher-docs';
import SlideView from './slide-view';

/**
 * Full-screen presenter. →/Space/PageDown or a click on the slide reveals the next
 * item (REVEAL ORDER, see teacher-docs.ts), then moves to the next slide; ←/PageUp
 * steps back. N toggles speaker notes, Esc exits.
 */
export default function PresentMode({ content, start = 0, onClose }: { content: SlidesContent; start?: number; onClose: () => void }) {
  const slides = content.slides;
  const total = slides.length;
  const [pos, setPos] = useState({ i: Math.max(0, Math.min(start, total - 1)), step: 0 });
  const [notes, setNotes] = useState(false);

  const next = useCallback(() => setPos(p => {
    if (slides[p.i] && p.step < revealSteps(slides[p.i])) return { i: p.i, step: p.step + 1 };
    return p.i < total - 1 ? { i: p.i + 1, step: 0 } : p;
  }), [slides, total]);
  const prev = useCallback(() => setPos(p => {
    if (p.step > 0) return { i: p.i, step: p.step - 1 };
    return p.i > 0 && slides[p.i - 1] ? { i: p.i - 1, step: revealSteps(slides[p.i - 1]) } : p;
  }), [slides]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') onClose();
      else if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key.toLowerCase() === 'n') setNotes(n => !n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  const i = Math.min(pos.i, total - 1);
  const slide = slides[i];
  const steps = revealSteps(slide);
  const step = Math.min(pos.step, steps);
  const atStart = i === 0 && step === 0;
  const atEnd = i === total - 1 && step >= steps;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div key={i} onClick={next} className={`w-full max-h-full vs-slide-in ${atEnd ? '' : 'cursor-pointer'}`}
          style={{ maxWidth: 'calc((100vh - 120px) * 16 / 9)' }}>
          <SlideView slide={slide} theme={content.theme} index={i} total={total} reveal={step} animate />
        </div>
      </div>
      {notes && (slide.notes || slide.visual) && (
        <div className="mx-auto mb-2 max-w-4xl w-full px-4 text-sm text-gray-200 bg-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
          {slide.visual && <p className="text-gray-300">👉 {slide.visual}</p>}
          {slide.notes && <p>{slide.notes}</p>}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 pb-4 text-white">
        <button onClick={prev} disabled={atStart} aria-label={step > 0 ? 'Hide last item' : 'Previous slide'} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
        <div className="min-w-[4rem] flex items-center justify-center gap-2.5 px-1">
          <span className="text-sm tabular-nums">{i + 1} / {total}</span>
          {steps > 0 && (
            <span className="flex items-center gap-1" role="progressbar" aria-label="Items revealed on this slide" aria-valuemin={0} aria-valuemax={steps} aria-valuenow={step}>
              {Array.from({ length: steps }, (_, k) => (
                <span key={k} className={`rounded-full transition-all duration-300 ${k < step ? 'w-2 h-2 bg-saffron' : 'w-1.5 h-1.5 bg-white/30'}`} />
              ))}
            </span>
          )}
        </div>
        <button onClick={next} disabled={atEnd} aria-label={step < steps ? 'Reveal next item' : 'Next slide'} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
        <button onClick={() => setNotes(n => !n)} aria-pressed={notes} className={`ml-4 h-10 px-3 rounded-full flex items-center gap-1.5 text-sm ${notes ? 'bg-saffron' : 'bg-white/10 hover:bg-white/20'}`}><StickyNote className="w-4 h-4" /> Notes</button>
        <button onClick={onClose} aria-label="Exit presentation" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><X className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

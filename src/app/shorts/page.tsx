'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Loader2, X, Check, ArrowLeft, Film } from 'lucide-react';
import ReelPlayer from '@/components/shorts/reel-player';
import type { Short } from '@/lib/shorts';
import { LANGUAGES } from '@/lib/languages';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [language, setLanguage] = useState('English');
  const [langOpen, setLangOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/shorts')
      .then(r => r.json())
      .then(d => setShorts(Array.isArray(d.shorts) ? d.shorts : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!containerRef.current || shorts.length === 0) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = Number((e.target as HTMLElement).dataset.index);
            if (!Number.isNaN(i)) setActiveIdx(i);
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] },
    );
    slideRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [shorts]);

  const scrollTo = (i: number) => {
    const clamped = Math.max(0, Math.min(shorts.length - 1, i));
    slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="h-[100dvh] bg-[#07070D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          <p className="text-sm">Loading reels…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 bg-[#07070D]">
      {/* Vertical snap feed */}
      <div
        ref={containerRef}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
        {shorts.map((short, i) => (
          <div
            key={short.id}
            data-index={i}
            ref={el => { slideRefs.current[i] = el; }}
            className="h-[100dvh] w-full snap-start snap-always flex items-center justify-center p-3 sm:p-5"
          >
            <div className="relative w-full max-w-[430px] h-full max-h-[880px] sm:h-[calc(100dvh-2.5rem)]">
              <ReelPlayer
                short={short}
                active={i === activeIdx}
                muted={muted}
                language={language}
                onToggleMute={() => setMuted(m => !m)}
                onOpenLanguages={() => setLangOpen(true)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Top overlay bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-4 pointer-events-none">
        <Link href="/" className="pointer-events-auto w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur text-white text-sm font-heading font-semibold">
          <Film className="w-4 h-4 text-saffron" /> Reels
          <span className="text-white/50 font-normal ml-1">{activeIdx + 1}/{shorts.length}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Desktop nav arrows */}
      <div className="hidden sm:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-40">
        <button onClick={() => scrollTo(activeIdx - 1)} disabled={activeIdx === 0} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white disabled:opacity-25 transition-all" aria-label="Previous">
          <ChevronUp className="w-5 h-5" />
        </button>
        <button onClick={() => scrollTo(activeIdx + 1)} disabled={activeIdx === shorts.length - 1} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white disabled:opacity-25 transition-all" aria-label="Next">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Language sheet — 22 Indian languages */}
      {langOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLangOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-dark-surface border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[75vh] overflow-y-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-heading font-bold text-white">Choose language</h3>
              <button onClick={() => setLangOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-white/50 text-xs mb-4">The AI teacher will explain in your language 🌐</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.name}
                  onClick={() => { setLanguage(l.name); setLangOpen(false); }}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left transition-all ${
                    language === l.name
                      ? 'border-saffron bg-saffron/15 text-white'
                      : 'border-white/10 text-white/80 hover:border-white/30'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{l.name}</span>
                    <span className="block text-xs text-white/50 truncate">{l.native}</span>
                  </span>
                  {language === l.name && <Check className="w-4 h-4 text-saffron shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

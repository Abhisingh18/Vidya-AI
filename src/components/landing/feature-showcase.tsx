'use client';

// The landing page's feature showcase: a list of tools on the left, one big animated demo on
// the right. It advances by itself (with a progress bar on the active tool) while on screen
// and stops when the visitor hovers or picks a tool. On phones the list is a scrolling strip.

import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Frame, LessonDemo, QuizDemo, SlidesDemo } from '@/components/teacher/create-demos';
import { DEMOS, type FeatureDemoId } from './feature-demos';
import { FlashcardsRich, MockRich, XpRich } from './rich-demos';

export interface ShowcaseFeature { icon: ComponentType<{ className?: string }>; title: string; desc: string; tags: string[]; href: string; demo?: FeatureDemoId }

const RICH: Partial<Record<FeatureDemoId, ComponentType>> = {
  slides: SlidesDemo, quiz: QuizDemo, lesson: LessonDemo, flashcards: FlashcardsRich, mock: MockRich, xp: XpRich,
};
const BASE_W = 270;
const BASE_H = 144;
const SECONDS = 7;

/** The small card demos, blown up to fill the stage. */
function Scaled({ id }: { id: FeatureDemoId }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1.6);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.max(1, e.contentRect.width / BASE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const Demo = DEMOS[id];
  return (
    <div ref={box} className="w-full overflow-hidden rounded-xl bg-gradient-to-br from-off-white to-saffron/10 ring-1 ring-white/10 dark:from-dark-bg" style={{ height: BASE_H * k }}>
      <div style={{ width: BASE_W, height: BASE_H, transform: `scale(${k})`, transformOrigin: 'top left' }} className="p-3"><Demo on /></div>
    </div>
  );
}

export default function FeatureShowcase({ features }: { features: ShowcaseFeature[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setI(0); }, [features]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => setI(x => (x + 1) % features.length), SECONDS * 1000);
    return () => clearTimeout(id);
  }, [i, paused, inView, features.length]);

  const f = features[Math.min(i, features.length - 1)];
  const Rich = f.demo ? RICH[f.demo] : undefined;
  const Icon = f.icon;

  return (
    <div ref={root} className="mt-10 grid items-start gap-6 lg:grid-cols-[340px_1fr]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0" role="tablist" aria-label="Features">
        {features.map((x, n) => {
          const on = n === i;
          const XI = x.icon;
          return (
            <li key={x.title} className="shrink-0 lg:shrink">
              <button role="tab" aria-selected={on} onClick={() => { setI(n); setPaused(true); }}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all duration-300 ${on
                  ? 'border-saffron bg-white shadow-card-hover dark:bg-dark-surface lg:translate-x-1'
                  : 'border-card-border bg-white/60 hover:border-saffron/40 dark:border-dark-border dark:bg-dark-surface/50'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${on ? 'bg-gradient-to-br from-saffron to-orange-600 text-white shadow-saffron' : 'bg-saffron/10 text-saffron'}`}><XI className="h-4 w-4" /></span>
                <span className="whitespace-nowrap font-heading text-sm font-bold text-navy lg:whitespace-normal dark:text-dark-text">{x.title}</span>
                {on && !paused && inView && <span key={`${n}-${i}`} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-saffron" style={{ animation: `phGrowX ${SECONDS}s linear both` }} />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="min-w-0">
        <div key={f.title} className="ph-rise">
          {Rich ? <Rich /> : f.demo ? <Frame label={`${f.title} · live preview`}><Scaled id={f.demo} /></Frame> : null}
          <div className="mt-5 flex flex-wrap items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron/15 to-indigo-brand/15 text-saffron"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-xl font-extrabold text-navy dark:text-dark-text">{f.title}</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{f.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.tags.map(t => <span key={t} className="rounded-full bg-saffron/10 px-2.5 py-0.5 text-[11px] font-semibold text-saffron">{t}</span>)}
              </div>
            </div>
            <Link href={f.href} className="btn-saffron group !px-5 !py-2.5 text-sm">Try it <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

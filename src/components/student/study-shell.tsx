// Shared frame of the student study studios (Flashcards, Revision Notes, Mock Tests,
// Study Planner). Each studio has its own colour; the page is a compact header, the
// create form beside a live preview of what it will make (in the form components),
// and below that a shelf of saved items with a coloured cover. Server-renderable.

import type { ReactNode } from 'react';

export type StudyTheme = 'flash' | 'notes' | 'mock' | 'plan';

// One colour for every studio: the VidyaAI saffron.
export const THEMES: Record<StudyTheme, { tile: string; cover: string; wash: string; text: string; soft: string; dot: string }> = {
  flash: { tile: 'from-saffron to-orange-600', cover: 'from-orange-400 via-saffron to-orange-600', wash: '', text: 'text-saffron', soft: 'bg-saffron/10', dot: 'bg-saffron' },
  notes: { tile: 'from-saffron to-orange-600', cover: 'from-orange-400 via-saffron to-orange-600', wash: '', text: 'text-saffron', soft: 'bg-saffron/10', dot: 'bg-saffron' },
  mock: { tile: 'from-saffron to-orange-600', cover: 'from-orange-400 via-saffron to-orange-600', wash: '', text: 'text-saffron', soft: 'bg-saffron/10', dot: 'bg-saffron' },
  plan: { tile: 'from-saffron to-orange-600', cover: 'from-orange-400 via-saffron to-orange-600', wash: '', text: 'text-saffron', soft: 'bg-saffron/10', dot: 'bg-saffron' },
};

/** Card around a studio's create form. */
export const studioCardCls =
  'relative rounded-2xl border border-card-border bg-off-white/70 p-5 sm:p-6 dark:border-dark-border dark:bg-dark-bg/60';

/** Card of a saved item: lifts on hover. */
export const itemCardCls =
  'group relative overflow-hidden rounded-2xl border border-card-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark';

export function AccentStrip() { return null; }

/** Coloured cover on top of a saved item: a big emoji, floating shapes, an optional badge. */
export function Cover({ theme, emoji, badge }: { theme: StudyTheme; emoji: string; badge?: ReactNode }) {
  return (
    <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${THEMES[theme].cover}`}>
      <span aria-hidden className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <span aria-hidden className="absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-black/10" />
      <span aria-hidden className="absolute bottom-3 right-16 h-3 w-3 rounded-full bg-white/50" />
      <span className="absolute bottom-3 left-5 text-4xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{emoji}</span>
      {badge && <div className="absolute right-3 top-3">{badge}</div>}
    </div>
  );
}

export default function StudyShell({ theme, icon, title, subtitle, children }: {
  theme: StudyTheme; icon: ReactNode; title: string; subtitle: string; children: ReactNode;
}) {
  const t = THEMES[theme];
  return (
    <main className="min-h-screen bg-off-white px-3 pb-3 pt-20 sm:px-5 lg:pt-5 dark:bg-dark-bg">
      {/* the whole studio sits in one box that fills the screen */}
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-6xl rounded-3xl border border-card-border bg-white p-5 shadow-card sm:p-8 lg:min-h-[calc(100vh-2.5rem)] dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark">
        <header className="mb-7 flex items-start gap-4 border-b border-card-border pb-6 dark:border-dark-border">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-saffron [&>svg]:h-6 [&>svg]:w-6`}>{icon}</div>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-navy sm:text-3xl dark:text-dark-text">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

/** Heading above the saved items. */
export function StudySection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-card-border pb-3 dark:border-dark-border">
        <h2 className="font-heading text-xl font-bold text-navy dark:text-dark-text">{title}</h2>
        {hint && <p className="hidden text-xs text-muted sm:block">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

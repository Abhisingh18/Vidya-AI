// Shared look of the student study studios (Flashcards, Revision Notes, Mock Tests,
// Study Planner): an animated backdrop, a centred hero with perks, a glass card for
// the create form and a section for the saved items. Server-renderable.

import type { ReactNode } from 'react';
import GenerateBackdrop from '@/components/generate/backdrop';

/** Glass card for a studio's create form. */
export const studioCardCls =
  'relative rounded-[28px] border border-card-border bg-white/95 p-5 shadow-[0_24px_60px_-28px_rgba(26,26,46,0.35)] backdrop-blur-xl sm:p-7 dark:border-dark-border dark:bg-dark-surface/95';

/** Card in a saved-items grid (lift on hover, accent strip along the top). */
export const itemCardCls =
  'group relative overflow-hidden rounded-2xl border border-card-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-saffron/50 hover:shadow-card-hover dark:border-dark-border dark:bg-dark-surface dark:shadow-card-dark';

export function AccentStrip() {
  return <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-saffron via-rose-500 to-indigo-brand opacity-0 transition-opacity group-hover:opacity-100" />;
}

export interface Perk { emoji: string; text: string }

export default function StudyShell({ icon, badge, title, accent, subtitle, perks, children }: {
  icon: ReactNode; badge: string; title: string; accent: string; subtitle: string; perks: Perk[]; children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-off-white dark:bg-dark-bg">
      <GenerateBackdrop quiet />
      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-24 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron/20 bg-white/80 px-3 py-1 text-xs font-medium text-saffron backdrop-blur dark:bg-dark-surface/80">
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span> {badge}
          </div>
          <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-navy sm:text-5xl dark:text-dark-text">
            {title} <span className="text-gradient-saffron">{accent}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">{subtitle}</p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {perks.map(p => (
              <li key={p.text} className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-white/80 px-3 py-1.5 text-xs font-medium text-navy backdrop-blur dark:border-dark-border dark:bg-dark-surface/80 dark:text-dark-text">
                <span aria-hidden>{p.emoji}</span> {p.text}
              </li>
            ))}
          </ul>
        </header>
        <div className="relative z-10 mx-auto mt-8 max-w-3xl">{children}</div>
      </div>
    </main>
  );
}

/** Heading above the saved items. */
export function StudySection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="relative z-10 mx-auto mt-14 max-w-5xl">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-navy dark:text-dark-text">{title}</h2>
        {hint && <p className="hidden text-xs text-muted sm:block">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

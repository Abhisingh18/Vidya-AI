'use client';

// The big study card with a 3D flip: front = question/term, back = answer
// (+ optional example or memory trick). Click/tap or Space flips it.
import { Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import { CARD_KIND_LABEL, type Flashcard } from '@/lib/flashcards';

const KIND_TONE: Record<Flashcard['kind'], string> = {
  definition: 'bg-indigo-brand/10 text-indigo-brand dark:bg-indigo-brand/25 dark:text-indigo-brand-200',
  why: 'bg-saffron/10 text-saffron-600 dark:bg-saffron/20 dark:text-saffron-300',
  how: 'bg-teal/10 text-teal-600 dark:bg-teal/20 dark:text-teal-300',
  formula: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
  example: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  fact: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
};

/** Bigger type for short text, smaller for long. */
const sizeFor = (text: string, big: boolean) => {
  const n = text.length;
  if (big) return n < 50 ? 'text-2xl sm:text-3xl' : n < 110 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl';
  return n < 70 ? 'text-xl sm:text-2xl' : n < 160 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg';
};

export function KindChip({ kind }: { kind: Flashcard['kind'] }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${KIND_TONE[kind]}`}>{CARD_KIND_LABEL[kind]}</span>;
}

export default function FlashcardCard({ card, flipped, onFlip, onSpeak, speaking }: {
  card: Flashcard; flipped: boolean; onFlip: () => void; onSpeak?: () => void; speaking?: boolean;
}) {
  const face = 'absolute inset-0 rounded-3xl [backface-visibility:hidden] [-webkit-backface-visibility:hidden] flex flex-col overflow-hidden border';
  const speak = onSpeak && (
    <button type="button" onClick={e => { e.stopPropagation(); onSpeak(); }} aria-label="Read aloud"
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${speaking ? 'bg-saffron text-white' : 'text-muted hover:text-saffron hover:bg-saffron/10'}`}>
      <Volume2 className="w-4 h-4" />
    </button>
  );

  return (
    <div className="[perspective:1600px] w-full">
      <div
        role="button" tabIndex={0} aria-pressed={flipped}
        aria-label={flipped ? `Answer: ${card.back}. Click to see the question.` : `Question: ${card.front}. Click to see the answer.`}
        onClick={onFlip}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onFlip(); } }}
        data-testid="flashcard" data-flipped={flipped}
        className="relative w-full h-[min(62vh,400px)] min-h-[300px] cursor-pointer select-none [transform-style:preserve-3d] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none focus-visible:outline-none group"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Front */}
        <div className={`${face} bg-white dark:bg-dark-surface border-card-border dark:border-dark-border shadow-card-hover dark:shadow-card-dark-hover group-focus-visible:ring-4 group-focus-visible:ring-saffron/30`}>
          <div className="h-1.5 bg-gradient-saffron shrink-0" />
          <div className="flex items-center justify-between px-5 pt-4">
            <KindChip kind={card.kind} />
            {speak}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 flex flex-col items-center justify-center text-center gap-4">
            {card.emoji && <span className="text-5xl sm:text-6xl leading-none drop-shadow-sm" aria-hidden>{card.emoji}</span>}
            <p dir="auto" className={`font-heading font-bold text-navy dark:text-dark-text leading-snug ${sizeFor(card.front, true)}`}>{card.front}</p>
          </div>
          <p className="text-center text-xs text-muted pb-4 flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Tap to flip <span className="hidden sm:inline">· <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-card-border dark:border-dark-border">Space</kbd></span>
          </p>
        </div>

        {/* Back */}
        <div className={`${face} [transform:rotateY(180deg)] bg-gradient-to-br from-saffron-50 via-white to-indigo-brand-50 dark:from-[#2a1a14] dark:via-dark-surface dark:to-[#191838] border-saffron/30 dark:border-saffron/30 shadow-card-hover dark:shadow-card-dark-hover`}>
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-saffron">Answer</span>
            {speak}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 py-2 flex flex-col items-center justify-center text-center gap-4">
            <p dir="auto" className={`font-heading font-semibold text-navy dark:text-dark-text leading-snug ${sizeFor(card.back, false)}`}>{card.back}</p>
            {card.example && (
              <div dir="auto" className="flex items-start gap-2 text-left max-w-md w-full px-4 py-3 rounded-2xl bg-white/80 dark:bg-dark-bg/60 border border-saffron/20 text-sm text-navy/80 dark:text-dark-text/80">
                <Lightbulb className="w-4 h-4 text-saffron shrink-0 mt-0.5" /> <span>{card.example}</span>
              </div>
            )}
          </div>
          <p dir="auto" className="text-center text-xs text-muted pb-4 px-6 line-clamp-1">{card.emoji} {card.front}</p>
        </div>
      </div>
    </div>
  );
}

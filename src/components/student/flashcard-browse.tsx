'use client';

// Browse mode: every card in a grid, with edit / add / delete.
import { useMemo, useState } from 'react';
import { Check, Lightbulb, Loader2, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import {
  CARD_KIND_LABEL, CARD_KINDS, daysBetween, isNewCard, LIMITS, newCardId,
  type CardKind, type Flashcard,
} from '@/lib/flashcards';
import { ErrorNote, inputCls, labelCls, panelCls, textareaCls } from '@/components/teacher/ui';
import { KindChip } from './flashcard-card';

export type CardText = Omit<Flashcard, 'srs'>;

function dueLabel(c: Flashcard, today: string): { text: string; tone: string } {
  if (isNewCard(c)) return { text: 'New', tone: 'bg-indigo-brand/10 text-indigo-brand dark:text-indigo-brand-200' };
  const d = daysBetween(today, c.srs.due);
  if (d <= 0) return { text: 'Due today', tone: 'bg-saffron/10 text-saffron-600 dark:text-saffron-300' };
  return { text: d === 1 ? 'Tomorrow' : `In ${d} days`, tone: 'bg-teal/10 text-teal-600 dark:text-teal-300' };
}

function CardEditor({ initial, onSave, onCancel, saving }: {
  initial: CardText; onSave: (c: CardText) => void; onCancel: () => void; saving: boolean;
}) {
  const [c, setC] = useState(initial);
  const ok = c.front.trim() && c.back.trim();
  const set = (p: Partial<CardText>) => setC(x => ({ ...x, ...p }));
  return (
    <form onSubmit={e => { e.preventDefault(); if (ok) onSave(c); }} className="space-y-3" data-testid="card-editor">
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={c.kind} onChange={e => set({ kind: e.target.value as CardKind })}>
            {CARD_KINDS.map(k => <option key={k} value={k}>{CARD_KIND_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Emoji</label>
          <input className={`${inputCls} text-center text-lg`} value={c.emoji} maxLength={LIMITS.emoji} onChange={e => set({ emoji: e.target.value })} placeholder="🌱" aria-label="Emoji" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Front — question or term</label>
        <textarea dir="auto" className={`${textareaCls} min-h-[64px]`} value={c.front} maxLength={LIMITS.front} onChange={e => set({ front: e.target.value })} required aria-label="Front" />
      </div>
      <div>
        <label className={labelCls}>Back — answer</label>
        <textarea dir="auto" className={`${textareaCls} min-h-[64px]`} value={c.back} maxLength={LIMITS.back} onChange={e => set({ back: e.target.value })} required aria-label="Back" />
      </div>
      <div>
        <label className={labelCls}>Example or memory trick <span className="normal-case font-normal tracking-normal">(optional)</span></label>
        <input dir="auto" className={inputCls} value={c.example} maxLength={LIMITS.example} onChange={e => set({ example: e.target.value })} aria-label="Example" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-outline !py-2 !px-4 text-sm"><X className="w-4 h-4" /> Cancel</button>
        <button type="submit" disabled={!ok || saving} className="btn-saffron !py-2 !px-4 text-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save card
        </button>
      </div>
    </form>
  );
}

export default function FlashcardBrowse({ cards, today, onSave, onDelete, onReset }: {
  cards: Flashcard[];
  today: string;
  onSave: (card: CardText) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null); // card id, or 'new'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? cards.filter(c => `${c.front} ${c.back} ${c.example}`.toLowerCase().includes(q)) : cards;
  }, [cards, query]);

  const run = async (fn: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try { await fn(); setEditing(null); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  const blank: CardText = { id: '', kind: 'definition', front: '', back: '', example: '', emoji: '' };

  return (
    <div data-testid="browse">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input className={`${inputCls} pl-10`} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${cards.length} cards`} aria-label="Search cards" />
        </div>
        <button onClick={() => { setEditing('new'); setError(null); }} disabled={editing === 'new'} className="btn-saffron !py-2.5 !px-5 text-sm disabled:opacity-60">
          <Plus className="w-4 h-4" /> Add card
        </button>
      </div>

      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {editing === 'new' && (
          <li className={`${panelCls} p-4 border-saffron/50 sm:col-span-2 lg:col-span-1`}>
            <p className="font-heading font-semibold text-navy dark:text-dark-text mb-3">New card</p>
            <CardEditor initial={{ ...blank, id: newCardId() }} saving={saving} onCancel={() => setEditing(null)} onSave={c => run(() => onSave(c))} />
          </li>
        )}
        {shown.map(c => {
          const due = dueLabel(c, today);
          return (
            <li key={c.id} className={`${panelCls} p-4 flex flex-col group ${editing === c.id ? 'border-saffron/50' : ''}`} data-testid="browse-card">
              {editing === c.id ? (
                <CardEditor initial={c} saving={saving} onCancel={() => setEditing(null)} onSave={x => run(() => onSave(x))} />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    {c.emoji && <span className="text-xl leading-none" aria-hidden>{c.emoji}</span>}
                    <KindChip kind={c.kind} />
                    <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${due.tone}`}>{due.text}</span>
                  </div>
                  <p dir="auto" className="font-heading font-semibold text-navy dark:text-dark-text leading-snug">{c.front}</p>
                  <div className="my-3 border-t border-dashed border-card-border dark:border-dark-border" />
                  <p dir="auto" className="text-sm text-navy/80 dark:text-dark-text/80 leading-relaxed flex-1">{c.back}</p>
                  {c.example && (
                    <p dir="auto" className="mt-2 text-xs text-muted flex gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-saffron shrink-0 mt-px" /> {c.example}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 -mb-1 justify-end sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(c.id); setError(null); }} aria-label="Edit card" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-saffron hover:bg-saffron/10"><Pencil className="w-4 h-4" /></button>
                    <button aria-label="Delete card" disabled={cards.length <= 1}
                      onClick={() => { if (confirm('Delete this card?')) void run(() => onDelete(c.id)); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="text-sm text-muted text-center py-10">No cards match “{query}”.</p>}

      <div className="mt-8 text-center">
        <button onClick={() => { if (confirm('Forget all review progress for this deck? Every card becomes new again.')) void run(onReset); }}
          className="text-xs text-muted hover:text-red-500 inline-flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset review progress</button>
      </div>
    </div>
  );
}

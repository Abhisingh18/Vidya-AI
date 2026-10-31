'use client';

// "Was this helpful? 👍 👎" under an AI result. A 👎 asks why (one tap) with an optional note.
// Votes go to /api/feedback and steer future results (see src/lib/feedback.ts).

import { useEffect, useState } from 'react';
import { Check, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { FEEDBACK_REASONS, MAX_FEEDBACK_NOTE, type FeedbackFeature, type FeedbackReason } from '@/lib/feedback-shared';

type Vote = 1 | -1 | 0;

async function send(json: Record<string, unknown>) {
  const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
  if (!res.ok) throw new Error('save failed');
}

export default function FeedbackBar({ feature, refId, label = 'Was this helpful?', className = '' }: {
  feature: FeedbackFeature; refId: string; label?: string; className?: string;
}) {
  const [vote, setVote] = useState<Vote>(0);
  const [reason, setReason] = useState<FeedbackReason | null>(null);
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/feedback?feature=${feature}&refId=${encodeURIComponent(refId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (live && d) { setVote(d.rating ?? 0); setReason(d.reason ?? null); } })
      .catch(() => {});
    return () => { live = false; };
  }, [feature, refId]);

  const save = async (next: Vote, why: FeedbackReason | null = null, text = '') => {
    setBusy(true); setFailed(false);
    try {
      await send({ feature, refId, rating: next, reason: why, note: text });
      setVote(next); setReason(why);
      setThanks(next !== 0);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  };

  const up = () => { setAsking(false); void save(vote === 1 ? 0 : 1); };
  const down = () => {
    if (vote === -1) { setAsking(false); void save(0); return; }
    setAsking(true); setThanks(false);
  };

  const btn = (on: boolean, tone: 'up' | 'down') =>
    `inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-all disabled:opacity-60 ${
      on
        ? tone === 'up' ? 'border-teal bg-teal/10 text-teal' : 'border-rose-400 bg-rose-500/10 text-rose-500'
        : 'border-card-border text-muted hover:border-saffron/50 hover:text-saffron dark:border-dark-border'}`;

  return (
    <div className={`print:hidden ${className}`} data-testid={`feedback-${feature}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-muted">{label}</span>
        <button type="button" onClick={up} disabled={busy} aria-pressed={vote === 1} aria-label="Helpful" className={btn(vote === 1, 'up')}>
          <ThumbsUp className="h-4 w-4" /> Yes
        </button>
        <button type="button" onClick={down} disabled={busy} aria-pressed={vote === -1 || asking} aria-label="Not helpful" className={btn(vote === -1 || asking, 'down')}>
          <ThumbsDown className="h-4 w-4" /> No
        </button>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        {thanks && !busy && !asking && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal"><Check className="h-3.5 w-3.5" /> Thanks — this helps VidyaAI get better</span>
        )}
        {failed && <span className="text-xs text-rose-500">Couldn’t save. Try again.</span>}
      </div>

      {asking && (
        <div className="mt-3 rounded-2xl border border-card-border bg-off-white/70 p-3 dark:border-dark-border dark:bg-dark-bg/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">What went wrong?</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FEEDBACK_REASONS) as FeedbackReason[]).map(r => (
              <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${reason === r ? 'border-saffron bg-saffron text-white' : 'border-card-border text-navy hover:border-saffron/50 dark:border-dark-border dark:text-dark-text'}`}>
                {FEEDBACK_REASONS[r]}
              </button>
            ))}
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value.slice(0, MAX_FEEDBACK_NOTE))} rows={2}
            placeholder="Anything else? (optional — please don’t add personal details)"
            className="mt-3 w-full resize-none rounded-xl border border-card-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-saffron dark:border-dark-border dark:bg-dark-surface dark:text-dark-text" />
          <div className="mt-2 flex items-center gap-2">
            <button type="button" disabled={busy || !reason} onClick={() => { setAsking(false); void save(-1, reason, note); }}
              className="btn-saffron !px-4 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50">Send feedback</button>
            <button type="button" onClick={() => setAsking(false)} className="text-xs font-medium text-muted hover:text-navy dark:hover:text-dark-text">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft, Check, CloudOff, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SaveState } from './use-doc';

export default function EditorBar({ back, title, onTitle, saveState, meta, actions }: {
  back: string; title: string; onTitle: (t: string) => void; saveState: SaveState; meta: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6 print:hidden">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link href={back} aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron hover:text-saffron">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <input value={title} onChange={e => onTitle(e.target.value)} aria-label="Title" maxLength={200}
            className="w-full bg-transparent text-xl lg:text-2xl font-heading font-bold text-navy dark:text-dark-text outline-none border-b-2 border-transparent focus:border-saffron/50 truncate" />
          <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
            {meta} ·
            {saveState === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
            {saveState === 'saved' && <><Check className="w-3 h-3 text-teal" /> Saved</>}
            {saveState === 'unsaved' && <>Unsaved changes</>}
            {saveState === 'error' && <span className="text-red-500 flex items-center gap-1"><CloudOff className="w-3 h-3" /> Couldn&apos;t save — check your connection</span>}
          </p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

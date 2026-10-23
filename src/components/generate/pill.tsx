'use client';

// A compact toolbar button that opens a small menu of options — the composer's
// "Video type / Language / Class / Voice" controls on the generate page.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface PillOption<T extends string> { value: T; label: string; hint?: string; icon?: ReactNode }

export default function Pill<T extends string>({ icon, label, value, options, onChange, disabled, up = false, title, wide = false }: {
  icon: ReactNode; label: string; value: T; options: PillOption<T>[]; onChange: (v: T) => void;
  disabled?: boolean; up?: boolean; title: string; wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} disabled={disabled} title={title} aria-haspopup="listbox" aria-expanded={open}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? 'border-saffron bg-saffron/10 text-saffron' : 'border-card-border bg-white text-navy hover:border-saffron/50 hover:bg-saffron/5 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text'}`}>
        <span className="flex shrink-0 items-center text-saffron">{icon}</span>
        <span className="max-w-[8.5rem] truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={title}
          className={`absolute left-0 z-50 max-h-72 overflow-y-auto rounded-2xl border border-card-border bg-white p-1.5 shadow-[0_18px_50px_-12px_rgba(26,26,46,0.35)] animate-fade-in dark:border-dark-border dark:bg-dark-surface ${
            up ? 'bottom-full mb-2' : 'top-full mt-2'} ${wide ? 'w-72 grid grid-cols-2 gap-0.5' : 'w-60'}`}>
          {options.map(o => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                o.value === value ? 'bg-saffron/10 text-saffron' : 'text-navy hover:bg-off-white dark:text-dark-text dark:hover:bg-dark-bg'}`}>
              {o.icon && <span className="shrink-0 text-base leading-none">{o.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{o.label}</span>
                {o.hint && <span className="block truncate text-[11px] text-muted">{o.hint}</span>}
              </span>
              {o.value === value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

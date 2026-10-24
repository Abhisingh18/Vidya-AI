'use client';

import type { ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const inputCls =
  'w-full h-11 px-3.5 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text text-sm outline-none transition-all focus:border-saffron focus:ring-2 focus:ring-saffron/20';
export const textareaCls = inputCls.replace('h-11', 'min-h-[88px] py-2.5 resize-y');
export const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5';
export const panelCls = 'bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-2xl shadow-card dark:shadow-card-dark';

export function TeacherPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16 print:p-0 print:max-w-none">{children}</div>
    </main>
  );
}

export function PageHeader({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div className="flex items-start gap-3">
        {icon && <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-saffron flex items-center justify-center text-white">{icon}</div>}
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-navy dark:text-dark-text">{title}</h1>
          {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="w-5 h-5 animate-spin text-saffron" /> {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-card-border bg-white/60 p-10 text-center backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/60">
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-saffron/15 to-indigo-brand/15 text-saffron flex items-center justify-center">{icon}</div>
      <p className="font-heading font-semibold text-navy dark:text-dark-text">{title}</p>
      {children && <div className="text-sm text-muted mt-1">{children}</div>}
    </div>
  );
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.json !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export const timeAgo = (iso: string | Date) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

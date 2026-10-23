'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, LogIn, Users } from 'lucide-react';
import { api, EmptyState, ErrorNote, PageHeader, panelCls, Spinner, TeacherPage } from '@/components/teacher/ui';

interface ClassRow { id: string; name: string; subject: string | null; grade: string | null; teacher: string | null; assignments: number }

export default function StudentClasses() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => api<{ classes: ClassRow[] }>('/api/classes').then(d => setClasses(d.classes)).catch(() => setClasses([]));
  useEffect(() => { load(); }, []);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api('/api/classes/join', { method: 'POST', json: { code } });
      setCode('');
      await load();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <TeacherPage>
      <PageHeader icon={<Users className="w-5 h-5" />} title="My Classes" subtitle="Join your teacher's class to get quizzes, slides and videos they assign." />

      <form onSubmit={join} className={`${panelCls} p-5 mb-8 flex flex-col sm:flex-row gap-3 sm:items-center`}>
        <label htmlFor="code" className="text-sm font-medium text-navy dark:text-dark-text shrink-0">Class code</label>
        <input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123"
          className="h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg font-mono text-lg tracking-[0.4em] uppercase text-navy dark:text-dark-text outline-none focus:border-saffron sm:w-48" />
        <button type="submit" disabled={busy || code.length !== 6} className="btn-saffron disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Join class
        </button>
        {error && <div className="sm:ml-2"><ErrorNote>{error}</ErrorNote></div>}
      </form>

      {!classes ? <Spinner /> : !classes.length ? (
        <EmptyState icon={<Users className="w-6 h-6" />} title="You haven't joined a class yet">Ask your teacher for the 6-character class code.</EmptyState>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(c => (
            <li key={c.id}>
              <Link href={`/classes/${c.id}`} className={`${panelCls} block p-5 hover:border-saffron/50 transition-colors`}>
                <p className="font-heading font-semibold text-navy dark:text-dark-text">{c.name}</p>
                <p className="text-xs text-muted mt-1">{[c.subject, c.teacher && `by ${c.teacher}`].filter(Boolean).join(' · ')}</p>
                <p className="text-sm text-muted mt-4">{c.assignments} assignment{c.assignments === 1 ? '' : 's'}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </TeacherPage>
  );
}

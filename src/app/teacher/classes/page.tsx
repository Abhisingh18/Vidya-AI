'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Users } from 'lucide-react';
import { GRADES } from '@/lib/teacher-docs';
import { api, EmptyState, ErrorNote, inputCls, labelCls, PageHeader, panelCls, Spinner, TeacherPage } from '@/components/teacher/ui';

interface ClassRow { id: string; name: string; subject: string | null; grade: string | null; joinCode: string; students: number; assignments: number }

export default function TeacherClasses() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => api<{ classes: ClassRow[] }>('/api/classes').then(d => setClasses(d.classes)).catch(() => setClasses([]));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api('/api/classes', { method: 'POST', json: { name, subject, grade } });
      setName(''); setSubject(''); setGrade('');
      await load();
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  return (
    <TeacherPage>
      <PageHeader icon={<Users className="w-5 h-5" />} title="My Classes" subtitle="Create a class, share its join code with students, and assign quizzes, slides or videos." />

      <form onSubmit={create} className={`${panelCls} p-5 mb-8 grid sm:grid-cols-[2fr_1.4fr_1fr_auto] gap-3 items-end`}>
        <div><label className={labelCls}>Class name</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 9-B Science" required maxLength={100} /></div>
        <div><label className={labelCls}>Subject</label><input className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" maxLength={60} /></div>
        <div><label className={labelCls}>Class</label>
          <select className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">—</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select></div>
        <button type="submit" disabled={busy || !name.trim()} className="btn-saffron h-11 !py-0 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
        </button>
        {error && <div className="sm:col-span-4"><ErrorNote>{error}</ErrorNote></div>}
      </form>

      {!classes ? <Spinner /> : !classes.length ? (
        <EmptyState icon={<Users className="w-6 h-6" />} title="No classes yet">Create one above — students join with its 6-letter code.</EmptyState>
      ) : (
        <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(c => (
            <li key={c.id}>
              <Link href={`/teacher/classes/${c.id}`} className={`${panelCls} block p-5 hover:border-saffron/50 transition-colors`}>
                <p className="font-heading font-semibold text-navy dark:text-dark-text">{c.name}</p>
                <p className="text-xs text-muted mt-1">{[c.subject, c.grade && `Class ${c.grade}`].filter(Boolean).join(' · ') || '—'}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted">{c.students} students · {c.assignments} assigned</span>
                  <span className="font-mono text-sm font-semibold tracking-widest text-saffron bg-saffron/10 px-2 py-1 rounded">{c.joinCode}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </TeacherPage>
  );
}

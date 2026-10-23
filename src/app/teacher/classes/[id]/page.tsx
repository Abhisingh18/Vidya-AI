'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ClipboardList, Copy, Loader2, NotebookPen, Plus, Presentation, Trash2, Video, X } from 'lucide-react';
import { api, EmptyState, ErrorNote, inputCls, labelCls, panelCls, Spinner, TeacherPage, timeAgo } from '@/components/teacher/ui';

interface Detail {
  class: { id: string; name: string; subject: string | null; grade: string | null; joinCode: string };
  students: { id: string; name: string | null; joinedAt: string }[];
  assignments: { id: string; kind: string; title: string; dueAt: string | null; createdAt: string; submissions: number; average: number | null }[];
}
const KIND_ICON: Record<string, typeof Video> = { quiz: ClipboardList, slides: Presentation, lesson: NotebookPen, video: Video };
const KIND_LABEL: Record<string, string> = { quiz: 'Quiz', slides: 'Slides', lesson: 'Lesson plan', video: 'Video' };

export default function TeacherClass({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'assignments' | 'students'>('assignments');
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => api<Detail>(`/api/classes/${params.id}`).then(setData).catch(e => setError(e.message)), [params.id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <TeacherPage><ErrorNote>{error}</ErrorNote></TeacherPage>;
  if (!data) return <TeacherPage><Spinner /></TeacherPage>;

  const copyCode = async () => {
    await navigator.clipboard.writeText(data.class.joinCode);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const removeAssignment = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}" from this class? Student results for it will be deleted.`)) return;
    await api(`/api/classes/${params.id}/assignments/${id}`, { method: 'DELETE' });
    load();
  };
  const deleteClass = async () => {
    if (!confirm(`Delete class "${data.class.name}"? Students, assignments and results will be removed.`)) return;
    await api(`/api/classes/${params.id}`, { method: 'DELETE' });
    router.push('/teacher/classes');
  };

  return (
    <TeacherPage>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/teacher/classes" aria-label="Back" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-card-border dark:border-dark-border hover:border-saffron hover:text-saffron"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text truncate">{data.class.name}</h1>
            <p className="text-sm text-muted">{[data.class.subject, data.class.grade && `Class ${data.class.grade}`].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <div className={`${panelCls} px-4 py-2 flex items-center gap-3`}>
          <span className="text-xs text-muted uppercase tracking-wider">Join code</span>
          <span className="font-mono text-xl font-bold tracking-[0.3em] text-saffron">{data.class.joinCode}</span>
          <button onClick={copyCode} aria-label="Copy join code" className="p-1.5 text-muted hover:text-saffron">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        </div>
        <button onClick={() => setAssigning(true)} className="btn-saffron !py-2.5"><Plus className="w-4 h-4" /> Assign</button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-card-border dark:border-dark-border" role="tablist">
        {(['assignments', 'students'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${tab === t ? 'border-saffron text-saffron' : 'border-transparent text-muted hover:text-navy dark:hover:text-dark-text'}`}>
            {t} ({t === 'assignments' ? data.assignments.length : data.students.length})
          </button>
        ))}
      </div>

      {tab === 'assignments' ? (
        data.assignments.length ? (
          <ul className={`${panelCls} divide-y divide-card-border dark:divide-dark-border`}>
            {data.assignments.map(a => {
              const Icon = KIND_ICON[a.kind] ?? ClipboardList;
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
                  <Link href={`/teacher/assignments/${a.id}`} className="min-w-0 flex-1 hover:text-saffron">
                    <p className="text-sm font-medium text-navy dark:text-dark-text truncate">{a.title}</p>
                    <p className="text-xs text-muted">
                      {KIND_LABEL[a.kind]} · assigned {timeAgo(a.createdAt)}
                      {a.dueAt && ` · due ${new Date(a.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </Link>
                  {a.kind === 'quiz' && (
                    <span className="text-xs text-muted text-right shrink-0">
                      {a.submissions}/{data.students.length} submitted{a.average !== null && <><br />avg {a.average}%</>}
                    </span>
                  )}
                  <button onClick={() => removeAssignment(a.id, a.title)} aria-label={`Remove ${a.title}`} className="p-2 text-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="Nothing assigned yet">Use “Assign” to share a quiz, slides, lesson notes or a library video.</EmptyState>
      ) : data.students.length ? (
        <ul className={`${panelCls} divide-y divide-card-border dark:divide-dark-border`}>
          {data.students.map(s => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-indigo-brand/10 text-indigo-brand text-sm font-bold flex items-center justify-center">{s.name?.[0]?.toUpperCase() ?? '?'}</div>
              <span className="text-sm text-navy dark:text-dark-text flex-1">{s.name ?? 'Student'}</span>
              <span className="text-xs text-muted">joined {timeAgo(s.joinedAt)}</span>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={<ClipboardList className="w-6 h-6" />} title="No students yet">Share the join code <b>{data.class.joinCode}</b> — students enter it under “My Classes”.</EmptyState>}

      <button onClick={deleteClass} className="mt-10 text-sm text-red-500 hover:underline">Delete this class</button>

      {assigning && <AssignDialog classId={params.id} onClose={() => setAssigning(false)} onDone={() => { setAssigning(false); load(); }} />}
    </TeacherPage>
  );
}

function AssignDialog({ classId, onClose, onDone }: { classId: string; onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState('quiz');
  const [items, setItems] = useState<{ id: string; title: string }[] | null>(null);
  const [pick, setPick] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(null); setPick('');
    const load = kind === 'video'
      ? api<{ videos: { id: string; topic: string }[] }>('/api/library').then(d => d.videos.map(v => ({ id: v.id, title: v.topic })))
      : api<{ docs: { id: string; title: string }[] }>(`/api/teacher/docs?type=${kind}`).then(d => d.docs);
    load.then(list => { setItems(list); setPick(list[0]?.id ?? ''); }).catch(() => setItems([]));
  }, [kind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api(`/api/classes/${classId}/assignments`, {
        method: 'POST',
        json: { kind, ...(kind === 'video' ? { videoId: pick } : { docId: pick }), dueAt: dueAt || undefined },
      });
      onDone();
    } catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Assign to class">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className={`${panelCls} relative w-full max-w-md p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">Assign to class</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-muted hover:text-navy"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(KIND_LABEL).map(([k, label]) => {
            const Icon = KIND_ICON[k];
            return (
              <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                className={`rounded-xl border-2 p-2 text-xs flex flex-col items-center gap-1 ${kind === k ? 'border-saffron text-saffron bg-saffron/5' : 'border-card-border dark:border-dark-border text-muted'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            );
          })}
        </div>
        <div>
          <label className={labelCls}>{kind === 'video' ? 'Library video' : `Your ${KIND_LABEL[kind].toLowerCase()}`}</label>
          {items === null ? <div className={`${inputCls} flex items-center text-muted`}>Loading…</div> : items.length ? (
            <select className={inputCls} value={pick} onChange={e => setPick(e.target.value)}>
              {items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          ) : (
            <p className="text-sm text-muted">
              Nothing here yet. {kind !== 'video' && <Link className="text-saffron" href={kind === 'lesson' ? '/teacher/lesson-plans' : `/teacher/${kind === 'quiz' ? 'quizzes' : 'slides'}`}>Create one first</Link>}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Due date <span className="normal-case font-normal">(optional)</span></label>
          <input type="date" className={inputCls} value={dueAt} onChange={e => setDueAt(e.target.value)} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="submit" disabled={busy || !pick} className="btn-saffron w-full disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Assign
        </button>
      </form>
    </div>
  );
}

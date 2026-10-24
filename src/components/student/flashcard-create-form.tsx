'use client';

// "Make flashcards" / "Make revision notes" form: from a typed topic, uploaded
// notes/syllabus, a library video (?video=<id>) or — for flashcards — the
// student's own revision notes (?notes=<id>).
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard, FileUp, Loader2, NotebookText, PenLine, Search, Sparkles, X } from 'lucide-react';
import { CARD_COUNTS, normalizeGrade, STUDY_GRADES, localToday } from '@/lib/flashcards';
import { LANGUAGES } from '@/lib/languages';
import type { SourceFile } from '@/lib/source';
import SourceUpload from '@/components/teacher/source-upload';
import { api, ErrorNote, inputCls, labelCls } from '@/components/teacher/ui';

type Kind = 'flashcards' | 'notes';
type Tab = 'topic' | 'upload' | 'video';

interface VideoRow { id: string; topic: string; language: string; grade: string; subject?: string }

const COPY: Record<Kind, { button: string; busy: string; wait: string; uploadHint: string; placeholder: string }> = {
  flashcards: {
    button: 'Make flashcards',
    busy: 'Writing your cards…',
    wait: 'Usually 20–60 seconds. Each card tests one fact, so you can check yourself.',
    uploadHint: 'Upload your class notes, a chapter or the syllabus — every card will come from it.',
    placeholder: 'e.g. Photosynthesis, Laws of motion, The Mughal Empire',
  },
  notes: {
    button: 'Make revision notes',
    busy: 'Writing your revision sheet…',
    wait: 'Usually 20–60 seconds. You get key points, terms, formulas, a mind map and a self-check.',
    uploadHint: 'Upload your class notes, a chapter or the syllabus — the sheet will summarise it.',
    placeholder: 'e.g. Acids, bases and salts · Chapter 3 Metals and non-metals',
  },
};

const TABS: { id: Tab; label: string; icon: typeof PenLine }[] = [
  { id: 'topic', label: 'Type a topic', icon: PenLine },
  { id: 'upload', label: 'Upload notes', icon: FileUp },
  { id: 'video', label: 'From a video', icon: Clapperboard },
];

const IDEAS = ['Photosynthesis', 'Newton’s laws', 'Quadratic equations', 'The Mughal Empire', 'Acids, bases and salts', 'Human heart'];
const STEPS: Record<Kind, string[]> = {
  flashcards: ['Reading your topic', 'Writing the cards', 'Adding memory tricks'],
  notes: ['Reading your topic', 'Summarising key points', 'Drawing the mind map'],
};

const chip = (on: boolean) =>
  `px-3.5 h-10 rounded-xl text-sm font-semibold border-2 transition-colors ${on
    ? 'border-saffron bg-saffron text-white shadow-saffron'
    : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron/50'}`;

export default function StudyCreateForm({ kind, videoId, notesId, defaultTopic = '' }: { kind: Kind; videoId?: string; notesId?: string; defaultTopic?: string }) {
  const router = useRouter();
  const copy = COPY[kind];
  const [tab, setTab] = useState<Tab>(videoId ? 'video' : 'topic');
  const [topic, setTopic] = useState(defaultTopic);
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [grade, setGrade] = useState('9');
  const [language, setLanguage] = useState('English');
  const [count, setCount] = useState<number>(15);
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [videos, setVideos] = useState<VideoRow[] | null>(null);
  const [videoQuery, setVideoQuery] = useState('');
  const [notes, setNotes] = useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from ?video=<id> (public library endpoint) and ?notes=<id>.
  useEffect(() => {
    if (!videoId) return;
    api<VideoRow>(`/api/library/${encodeURIComponent(videoId)}`)
      .then(v => {
        setVideo(v);
        setGrade(g => normalizeGrade(v.grade) ?? g);
        if (LANGUAGES.some(l => l.name === v.language)) setLanguage(v.language);
      })
      .catch(() => setError('That video could not be found. Pick another one below.'));
  }, [videoId]);

  useEffect(() => {
    if (!notesId || kind !== 'flashcards') return;
    api<{ doc: { id: string; title: string; grade: string; language: string } }>(`/api/student/notes/${encodeURIComponent(notesId)}`)
      .then(({ doc }) => {
        setNotes({ id: doc.id, title: doc.title });
        setGrade(g => normalizeGrade(doc.grade) ?? g);
        if (LANGUAGES.some(l => l.name === doc.language)) setLanguage(doc.language);
      })
      .catch(() => setError('Those notes could not be found.'));
  }, [notesId, kind]);

  useEffect(() => {
    if (tab !== 'video' || videos || notes) return;
    api<{ videos: VideoRow[] }>('/api/library').then(d => setVideos(d.videos)).catch(() => setVideos([]));
  }, [tab, videos, notes]);

  const shownVideos = useMemo(() => {
    const q = videoQuery.trim().toLowerCase();
    return (videos ?? []).filter(v => !q || `${v.topic} ${v.subject ?? ''} ${v.language}`.toLowerCase().includes(q)).slice(0, 30);
  }, [videos, videoQuery]);

  const ready = notes ? true : tab === 'topic' ? !!topic.trim() : tab === 'upload' ? sources.length > 0 || !!topic.trim() : !!video;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = { grade, language, today: localToday() };
    if (kind === 'flashcards') body.count = count;
    if (notes) body.notesId = notes.id;
    else if (tab === 'topic') body.topic = topic;
    else if (tab === 'upload') { body.topic = topic; body.sources = sources; }
    else if (video) body.videoId = video.id;
    try {
      const { id } = await api<{ id: string }>(`/api/student/${kind}`, { method: 'POST', json: body });
      router.push(`/${kind}/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
      {notes ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-saffron/10 border border-saffron/30">
          <NotebookText className="w-5 h-5 text-saffron shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-saffron">From your revision notes</p>
            <p className="font-heading font-semibold text-navy dark:text-dark-text truncate">{notes.title}</p>
          </div>
          <button type="button" onClick={() => { setNotes(null); router.replace('/flashcards'); }} aria-label="Don't use these notes"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-saffron"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Make it from" className="relative grid grid-cols-3 gap-1.5 rounded-2xl border border-card-border bg-off-white p-1.5 dark:border-dark-border dark:bg-dark-bg">
            <span aria-hidden className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem-0.75rem)/3)] rounded-xl bg-white shadow-card transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-dark-surface"
              style={{ transform: `translateX(calc(${TABS.findIndex(t => t.id === tab)} * (100% + 0.375rem)))` }} />
            {TABS.map(t => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`relative z-10 flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-colors sm:h-11 sm:flex-row sm:gap-2 sm:text-sm ${tab === t.id ? 'text-saffron' : 'text-muted hover:text-navy dark:hover:text-dark-text'}`}>
                <t.icon className={`h-4 w-4 transition-transform ${tab === t.id ? 'scale-110' : ''}`} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'topic' && (
            <div className="ph-rise">
              <label className={labelCls} htmlFor={`${kind}-topic`}>Topic or chapter</label>
              <div className="ph-glow">
                <input id={`${kind}-topic`} className={`${inputCls} !h-14 !rounded-2xl !text-base`} value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder={copy.placeholder} maxLength={200} autoComplete="off" />
              </div>
              <div className="ph-stagger mt-3 flex flex-wrap gap-2" aria-label="Ideas">
                {IDEAS.map(i => (
                  <button key={i} type="button" onClick={() => setTopic(i)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 ${topic === i ? 'border-saffron bg-saffron text-white shadow-saffron' : 'border-card-border text-muted hover:border-saffron/50 hover:text-saffron dark:border-dark-border'}`}>{i}</button>
                ))}
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              <SourceUpload files={sources} onChange={setSources} topic={topic} hint={copy.uploadHint} disabled={busy} label="Your notes or syllabus" />
              <div>
                <label className={labelCls} htmlFor={`${kind}-focus`}>Focus on <span className="normal-case font-normal tracking-normal">(optional)</span></label>
                <input id={`${kind}-focus`} className={inputCls} value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Chapter 3 only, or just the formulas" maxLength={200} autoComplete="off" />
              </div>
            </div>
          )}

          {tab === 'video' && (
            video ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-saffron/40 bg-saffron/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-saffron text-white flex items-center justify-center shrink-0"><Clapperboard className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-navy dark:text-dark-text truncate">{video.topic}</p>
                  <p className="text-xs text-muted">Uses this video&apos;s narration · {video.language} · {video.grade}</p>
                </div>
                <button type="button" onClick={() => setVideo(null)} className="text-sm font-semibold text-saffron hover:underline shrink-0">Change</button>
              </div>
            ) : (
              <div>
                <label className={labelCls} htmlFor={`${kind}-video-search`}>Pick a lesson from the library</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input id={`${kind}-video-search`} className={`${inputCls} pl-10`} value={videoQuery} onChange={e => setVideoQuery(e.target.value)}
                    placeholder="Search videos by topic or subject" autoComplete="off" />
                </div>
                <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-card-border dark:border-dark-border divide-y divide-card-border dark:divide-dark-border">
                  {!videos && <li className="p-4 text-sm text-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading videos…</li>}
                  {videos && !shownVideos.length && <li className="p-4 text-sm text-muted">No videos match.</li>}
                  {shownVideos.map(v => (
                    <li key={v.id}>
                      <button type="button" onClick={() => { setVideo(v); setGrade(g => normalizeGrade(v.grade) ?? g); if (LANGUAGES.some(l => l.name === v.language)) setLanguage(v.language); }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-saffron/5 flex items-center gap-3">
                        <Clapperboard className="w-4 h-4 text-saffron shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-sm font-medium text-navy dark:text-dark-text">{v.topic}</span>
                        <span className="text-xs text-muted shrink-0">{v.language} · {v.grade}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </>
      )}

      <div className={`grid gap-3 ${kind === 'flashcards' ? 'sm:grid-cols-[1fr_1fr_auto]' : 'grid-cols-2'}`}>
        <div className={kind === 'flashcards' ? 'grid grid-cols-2 sm:contents gap-3' : 'contents'}>
          <div>
            <label className={labelCls} htmlFor={`${kind}-grade`}>Class</label>
            <select id={`${kind}-grade`} className={inputCls} value={grade} onChange={e => setGrade(e.target.value)}>
              {STUDY_GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor={`${kind}-language`}>Language</label>
            <select id={`${kind}-language`} className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.name === l.native ? l.name : `${l.name} · ${l.native}`}</option>)}
            </select>
          </div>
        </div>
        {kind === 'flashcards' && (
          <div>
            <span className={labelCls} id="card-count-label">Cards in the deck</span>
            <div role="radiogroup" aria-labelledby="card-count-label" className="flex gap-1.5">
              {CARD_COUNTS.map(n => (
                <button key={n} type="button" role="radio" aria-checked={count === n} onClick={() => setCount(n)} className={`${chip(count === n)} flex-1 sm:flex-none min-w-[3rem] hover:-translate-y-0.5 ${count === n ? 'ph-pop' : ''}`}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-col items-center gap-2">
        <button type="submit" disabled={busy || !ready} className="btn-saffron h-12 w-full whitespace-nowrap px-7 text-base sm:w-auto sm:min-w-[16rem] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {copy.busy}</> : <><Sparkles className="w-4 h-4" /> {copy.button}</>}
        </button>
        {busy ? (
          <div className="w-full max-w-md" aria-live="polite">
            <div className="ph-sweep h-1.5 overflow-hidden rounded-full bg-saffron/15" />
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {STEPS[kind].map((st, i) => (
                <span key={st} className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron" style={{ animationDelay: `${i * 0.4}s` }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-saffron" />{st}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted">{copy.wait}</p>
          </div>
        ) : <p className="min-h-[1rem]" />}
      </div>
    </form>
  );
}

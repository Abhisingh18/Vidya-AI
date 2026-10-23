'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, ClipboardList, NotebookPen, Presentation, ScrollText, Users, Wrench } from 'lucide-react';
import { DOC_TYPES, type DocType } from '@/lib/teacher-docs';
import { api, panelCls, TeacherPage, timeAgo } from '@/components/teacher/ui';

interface DocRow { id: string; type: string; title: string; updatedAt: string }
interface ClassRow { id: string; name: string; students: number; assignments: number; joinCode: string }

const CREATE = [
  { type: 'slides' as DocType, title: 'Lecture slides', text: 'Topic → full deck you can edit, present & download as .pptx', icon: Presentation, tint: 'bg-saffron/10 text-saffron' },
  { type: 'quiz' as DocType, title: 'Quiz / worksheet', text: 'MCQ, true/false & short answers with an answer key', icon: ClipboardList, tint: 'bg-indigo-brand/10 text-indigo-brand' },
  { type: 'lesson' as DocType, title: 'Lesson plan', text: 'Objectives, timed class flow, activities & homework', icon: NotebookPen, tint: 'bg-teal/10 text-teal' },
  { type: 'exam' as DocType, title: 'Exam paper', text: 'Unit test to annual or semester exam: sections, choice, marking scheme', icon: ScrollText, tint: 'bg-amber-500/10 text-amber-600' },
];

export default function TeacherHome() {
  const { data: session } = useSession();
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    api<{ docs: DocRow[] }>('/api/teacher/docs').then(d => setDocs(d.docs)).catch(() => setDocs([]));
    api<{ classes: ClassRow[] }>('/api/classes').then(d => setClasses(d.classes)).catch(() => setClasses([]));
  }, []);

  const name = session?.user?.name ?? 'Teacher';
  const count = (t: string) => docs?.filter(d => d.type === t).length ?? 0;
  const students = classes?.reduce((t, c) => t + c.students, 0) ?? 0;
  const q = topic.trim() ? `?topic=${encodeURIComponent(topic.trim())}` : '';

  return (
    <TeacherPage>
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-[#0E0D3E] p-8 lg:p-10">
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-indigo-brand/20 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest text-saffron font-semibold mb-2">Teacher workspace</p>
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-white">Namaste, {name} 🙏</h1>
          <p className="text-gray-400 mt-2">What are you teaching next? Type a topic and pick what to prepare.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-3xl">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Newton's second law"
              className="flex-1 h-12 px-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-gray-400 outline-none focus:border-saffron" />
            <div className="flex gap-2">
              {CREATE.map(c => (
                <Link key={c.type} href={`${DOC_TYPES[c.type].path}${q}`} title={`New ${c.title.toLowerCase()}`}
                  className="h-12 px-4 rounded-xl bg-white/10 hover:bg-saffron text-white text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors">
                  <c.icon className="w-4 h-4" /> <span className="hidden xl:inline">{DOC_TYPES[c.type].plural}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          ['Slide decks', count('slides')], ['Quizzes', count('quiz')], ['Lesson plans', count('lesson')], ['Exam papers', count('exam')],
          ['Classes', classes?.length ?? 0], ['Students', students],
        ].map(([label, n]) => (
          <div key={label as string} className={`${panelCls} p-4`}>
            <p className="text-2xl font-heading font-bold text-navy dark:text-dark-text">{n}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {CREATE.map(c => (
          <Link key={c.type} href={DOC_TYPES[c.type].path} className={`${panelCls} p-5 group hover:border-saffron/50 transition-colors`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.tint}`}><c.icon className="w-5 h-5" /></div>
            <p className="font-heading font-semibold text-navy dark:text-dark-text mt-3">{c.title}</p>
            <p className="text-sm text-muted mt-1">{c.text}</p>
            <span className="text-sm text-saffron font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Create <ArrowRight className="w-4 h-4" /></span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Recent work</h2>
          <div className={`${panelCls} divide-y divide-card-border dark:divide-dark-border`}>
            {docs?.length ? docs.slice(0, 6).map(d => (
              <Link key={d.id} href={d.type === 'toolkit' ? '/teacher/toolkit' : `${DOC_TYPES[d.type as DocType].path}/${d.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-navy dark:text-dark-text truncate">{d.title}</span>
                  <span className="text-xs text-muted">{d.type === 'toolkit' ? 'Toolkit' : DOC_TYPES[d.type as DocType].label} · {timeAgo(d.updatedAt)}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-muted shrink-0" />
              </Link>
            )) : <p className="p-6 text-sm text-muted text-center">{docs ? 'Nothing yet — create your first deck, quiz or plan above.' : 'Loading…'}</p>}
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-navy dark:text-dark-text">Your classes</h2>
            <Link href="/teacher/classes" className="text-sm text-saffron">Manage</Link>
          </div>
          <div className={`${panelCls} divide-y divide-card-border dark:divide-dark-border`}>
            {classes?.length ? classes.slice(0, 6).map(c => (
              <Link key={c.id} href={`/teacher/classes/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-navy dark:text-dark-text truncate">{c.name}</span>
                  <span className="text-xs text-muted">{c.students} students · {c.assignments} assignments · code {c.joinCode}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-muted shrink-0" />
              </Link>
            )) : (
              <div className="p-6 text-center">
                <Users className="w-6 h-6 mx-auto text-muted mb-2" />
                <p className="text-sm text-muted">{classes ? 'No classes yet.' : 'Loading…'}</p>
                {classes && <Link href="/teacher/classes" className="text-sm text-saffron font-medium">Create a class</Link>}
              </div>
            )}
          </div>
          <Link href="/teacher/toolkit" className={`${panelCls} mt-4 p-4 flex items-center gap-3 hover:border-saffron/50`}>
            <Wrench className="w-5 h-5 text-saffron" />
            <span className="text-sm text-navy dark:text-dark-text"><b>Toolkit:</b> rubrics, NCERT alignment, translation, parent messages</span>
          </Link>
        </section>
      </div>
    </TeacherPage>
  );
}

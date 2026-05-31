'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Play, Eye, Star, ArrowUpRight, ChevronDown, Triangle, Atom, FlaskConical, Leaf, Monitor, Landmark, BookOpen, Sparkles, Clock, Check } from 'lucide-react';
import SceneThumbnail from '@/components/scene-thumbnail';
import type { SceneStep } from '@/components/scene-renderer';

type Subject = 'All' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Computer Science' | 'History' | 'General';
type Grade = 'All' | '6-8' | '9-10' | '11-12' | 'College';
type SortOption = 'Latest' | 'Most Viewed';

interface ApiVideo {
  id: string;
  topic: string;
  language: string;
  grade: string;
  subject: string;
  duration: number;
  createdAt: string;
  author: string;
  views: number;
  previewSteps?: SceneStep[];
}

const SUBJECT_ICON: Record<string, { icon: React.ElementType; gradient: string; pill: string; short: string }> = {
  Mathematics:        { icon: Triangle,    gradient: 'from-indigo-brand-400 to-indigo-brand-700', pill: 'bg-indigo-brand/10 text-indigo-brand dark:bg-indigo-brand/20', short: 'Math' },
  Physics:            { icon: Atom,         gradient: 'from-saffron-300 to-saffron-700',           pill: 'bg-saffron/10 text-saffron dark:bg-saffron/20',                short: 'Physics' },
  Chemistry:          { icon: FlaskConical, gradient: 'from-teal-400 to-teal-700',                 pill: 'bg-teal/10 text-teal dark:bg-teal/20',                         short: 'Chem' },
  Biology:            { icon: Leaf,         gradient: 'from-emerald-400 to-emerald-700',           pill: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', short: 'Bio' },
  'Computer Science': { icon: Monitor,      gradient: 'from-violet-400 to-violet-700',             pill: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400', short: 'CS' },
  History:            { icon: Landmark,     gradient: 'from-amber-400 to-amber-700',               pill: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', short: 'History' },
  General:            { icon: BookOpen,     gradient: 'from-gray-400 to-gray-700',                 pill: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400', short: 'General' },
};

const sortOptions: SortOption[] = ['Latest', 'Most Viewed'];

function getSubjectConfig(subject: string) {
  return SUBJECT_ICON[subject] ?? SUBJECT_ICON.General;
}

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : i - rating < 1 ? 'fill-amber-400/50 text-amber-400' : 'fill-gray-200 text-gray-300 dark:fill-dark-border dark:text-dark-border'}`} />
      ))}
      <span className="text-xs text-muted ml-0.5">{rating.toFixed(1)}</span>
    </span>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${active ? 'bg-saffron text-white shadow-sm' : 'bg-gray-100 dark:bg-dark-border text-muted hover:bg-gray-200 dark:hover:bg-dark-border/80'}`}>
      {label}
    </button>
  );
}

function VideoCard({ video, index, watched }: { video: ApiVideo; index: number; watched?: boolean }) {
  const config = getSubjectConfig(video.subject);
  const IconComp = config.icon;
  // Deterministic pseudo-rating from id so cards don't flicker on re-render
  const ratingSeed = video.id.charCodeAt(0) + video.id.charCodeAt(video.id.length - 1);
  const rating = 4 + ((ratingSeed % 10) / 10);
  const hasPreview = video.previewSteps && video.previewSteps.length > 0;
  return (
    <Link
      href={`/library/${video.id}`}
      className="group rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative h-40 bg-navy overflow-hidden">
        {hasPreview ? (
          <SceneThumbnail steps={video.previewSteps!} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}>
            <IconComp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white opacity-[0.12]" />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-[1px]">
          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-navy fill-current ml-0.5" />
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-white/95 text-xs px-2.5 py-1 rounded-full font-medium text-navy shadow-sm backdrop-blur-sm">{video.language}</div>
        {watched && (
          <div className="absolute top-3 right-3 bg-teal text-white text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1 shadow-sm">
            <Check className="w-3 h-3" /> Watched
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded-md font-mono flex items-center gap-1 backdrop-blur-sm"><Clock className="w-3 h-3" />{formatDuration(video.duration)}</div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-navy dark:text-dark-text line-clamp-2 leading-snug min-h-[2.5rem]">{video.topic}</h3>
        <span className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.pill}`}>{config.short}</span>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-muted"><Eye className="w-3.5 h-3.5" /><span className="text-xs">{formatViews(video.views)}</span></div>
          <StarRating rating={rating} />
        </div>
        <div className="h-0 group-hover:h-8 overflow-hidden transition-all duration-300 ease-out">
          <span className="inline-flex items-center gap-1 text-saffron text-xs font-medium mt-2">
            Watch now <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6">
        <Search className="w-9 h-9 text-muted" />
      </div>
      <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">No videos found</h3>
      <p className="text-muted text-sm mb-6 max-w-xs">Be the first to generate a video on this topic!</p>
      <Link href="/generate" className="btn-saffron text-sm"><Sparkles className="w-4 h-4" />Generate Video</Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100 dark:bg-dark-border" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 dark:bg-dark-border rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-dark-border rounded w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-dark-border rounded w-1/2" />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('All');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [sort, setSort] = useState<SortOption>('Latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/library');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setVideos(Array.isArray(data.videos) ? data.videos : []);
      } catch {
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load the user's watch progress (empty if not logged in).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/progress')
      .then(r => r.json())
      .then(d => { if (!cancelled) setWatched(new Set(Array.isArray(d.watched) ? d.watched : [])); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    videos.forEach(v => v.language && set.add(v.language));
    return ['All', ...Array.from(set).sort()];
  }, [videos]);

  const subjects: Subject[] = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'General'];
  const grades: Grade[] = ['All', '6-8', '9-10', '11-12', 'College'];

  const filteredVideos = useMemo(() => {
    let list = [...videos];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v => v.topic.toLowerCase().includes(q) || v.subject.toLowerCase().includes(q));
    }
    if (selectedSubject !== 'All') list = list.filter(v => v.subject === selectedSubject);
    if (selectedGrade !== 'All') list = list.filter(v => v.grade === selectedGrade);
    if (selectedLanguage !== 'All') list = list.filter(v => v.language === selectedLanguage);
    if (sort === 'Most Viewed') list.sort((a, b) => b.views - a.views);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [videos, search, selectedSubject, selectedGrade, selectedLanguage, sort]);

  const totalVideos = videos.length;
  const uniqueLanguages = new Set(videos.map(v => v.language)).size;
  const uniqueSubjects = new Set(videos.map(v => v.subject)).size;

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg transition-colors duration-300">
      <div className="container-main pt-24 pb-16">

        {/* Header */}
        <header className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/30 shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">VidyaAI Library</h1>
          </div>
          <p className="text-muted text-lg mt-1">Learn with the community — all generated animated videos in one place</p>
          <p className="text-sm text-muted mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block" />{totalVideos} videos</span>
            <span className="text-card-border dark:text-dark-border">·</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-brand inline-block" />{uniqueLanguages} languages</span>
            <span className="text-card-border dark:text-dark-border">·</span>
            <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />{uniqueSubjects} subjects</span>
          </p>
        </header>

        {/* Progress bar — shows the logged-in user's completion across the library */}
        {watched.size > 0 && totalVideos > 0 && (
          <div className="mt-5 p-4 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-navy dark:text-dark-text">Your progress</span>
              <span className="text-sm text-muted"><span className="font-semibold text-saffron">{watched.size}</span> / {totalVideos} watched</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden">
              <div className="h-full bg-gradient-saffron rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (watched.size / totalVideos) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="sticky top-16 z-30 mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="glass p-4 rounded-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics... e.g. Integration, DNA, Newton" className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text placeholder:text-muted/60 focus:border-saffron focus:outline-none transition-colors duration-200 text-sm font-body" />
            </div>
            <div className="mt-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">Subject</span>
                  {subjects.map(s => <Chip key={s} label={s === 'Computer Science' ? 'CS' : s === 'Mathematics' ? 'Math' : s} active={selectedSubject === s} onClick={() => setSelectedSubject(s)} />)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">Grade</span>
                  {grades.map(g => <Chip key={g} label={g} active={selectedGrade === g} onClick={() => setSelectedGrade(g)} />)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">Language</span>
                  {availableLanguages.map(l => <Chip key={l} label={l} active={selectedLanguage === l} onClick={() => setSelectedLanguage(l)} />)}
                </div>
              </div>
              <div className="relative shrink-0">
                <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-navy dark:text-dark-text hover:border-saffron transition-colors duration-200 cursor-pointer">
                  <span className="text-muted text-xs">Sort:</span>
                  <span className="font-medium">{sort}</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-xl shadow-card-hover overflow-hidden z-20 animate-fade-in">
                      {sortOptions.map(opt => (
                        <button key={opt} onClick={() => { setSort(opt); setSortOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${sort === opt ? 'bg-saffron/10 text-saffron font-medium' : 'text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border/50'}`}>{opt}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {(selectedSubject !== 'All' || selectedGrade !== 'All' || selectedLanguage !== 'All' || search.trim()) && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted"><span className="font-semibold text-navy dark:text-dark-text">{filteredVideos.length}</span> video{filteredVideos.length !== 1 ? 's' : ''} found</p>
                <button onClick={() => { setSearch(''); setSelectedSubject('All'); setSelectedGrade('All'); setSelectedLanguage('All'); }} className="text-xs text-saffron hover:underline font-medium cursor-pointer">Clear all filters</button>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredVideos.length > 0 ? (
            filteredVideos.map((video, i) => <VideoCard key={video.id} video={video} index={i} watched={watched.has(video.id)} />)
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Bottom CTA */}
        {!loading && filteredVideos.length > 0 && (
          <div className="mt-12 text-center animate-fade-in">
            <div className="inline-flex flex-col items-center gap-3 p-8 rounded-3xl bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-saffron/5 dark:to-indigo-brand/5 border border-card-border dark:border-dark-border">
              <Sparkles className="w-8 h-8 text-saffron" />
              <h3 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">Generate your own video!</h3>
              <p className="text-muted text-sm max-w-md">Choose any topic, select a language, and AI will create an animated video for you — completely free.</p>
              <Link href="/generate" className="btn-saffron mt-2"><Sparkles className="w-4 h-4" />Start Generating</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

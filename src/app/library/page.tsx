'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Play,
  Eye,
  Star,
  ArrowUpRight,
  ChevronDown,
  Triangle,
  Atom,
  FlaskConical,
  Leaf,
  Monitor,
  Landmark,
  BookOpen,
  Sparkles,
  Dna,
  Zap,
  Binary,
  Divide,
  Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Subject = 'All' | 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'CS' | 'History';
type Grade = 'All' | '6-8' | '9-10' | '11-12' | 'College';
type Language = 'All' | 'Hindi' | 'English' | 'Tamil' | 'Telugu' | 'Marathi';
type SortOption = 'Latest' | 'Most Viewed' | 'Top Rated' | 'Trending';

interface Video {
  id: number;
  title: string;
  subject: Exclude<Subject, 'All'>;
  language: Exclude<Language, 'All'>;
  duration: string;
  views: string;
  viewCount: number;
  rating: number;
  grade: Exclude<Grade, 'All'>;
}

// ── Subject config ─────────────────────────────────────────────────────────────

const subjectConfig: Record<
  Exclude<Subject, 'All'>,
  { icon: React.ElementType; gradient: string; pill: string }
> = {
  Math: {
    icon: Triangle,
    gradient: 'from-indigo-brand-400 to-indigo-brand-700',
    pill: 'bg-indigo-brand/10 text-indigo-brand dark:bg-indigo-brand/20',
  },
  Physics: {
    icon: Atom,
    gradient: 'from-saffron-300 to-saffron-700',
    pill: 'bg-saffron/10 text-saffron dark:bg-saffron/20',
  },
  Chemistry: {
    icon: FlaskConical,
    gradient: 'from-teal-400 to-teal-700',
    pill: 'bg-teal/10 text-teal dark:bg-teal/20',
  },
  Biology: {
    icon: Leaf,
    gradient: 'from-emerald-400 to-emerald-700',
    pill: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  CS: {
    icon: Monitor,
    gradient: 'from-violet-400 to-violet-700',
    pill: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  },
  History: {
    icon: Landmark,
    gradient: 'from-amber-400 to-amber-700',
    pill: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  },
};

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockVideos: Video[] = [
  { id: 1, title: 'Pythagoras Theorem', subject: 'Math', language: 'Hindi', duration: '3:42', views: '1.2k', viewCount: 1200, rating: 4.5, grade: '9-10' },
  { id: 2, title: "Newton's Laws of Motion", subject: 'Physics', language: 'English', duration: '4:15', views: '2.3k', viewCount: 2300, rating: 4.8, grade: '11-12' },
  { id: 3, title: 'Periodic Table — Elements & Trends', subject: 'Chemistry', language: 'Hindi', duration: '5:01', views: '890', viewCount: 890, rating: 4.2, grade: '11-12' },
  { id: 4, title: 'Photosynthesis — Process Explained', subject: 'Biology', language: 'Tamil', duration: '3:55', views: '1.5k', viewCount: 1500, rating: 4.6, grade: '9-10' },
  { id: 5, title: 'Integration Basics — Calculus', subject: 'Math', language: 'Hindi', duration: '6:12', views: '3.1k', viewCount: 3100, rating: 4.9, grade: 'College' },
  { id: 6, title: 'DNA Structure & Replication', subject: 'Biology', language: 'Telugu', duration: '4:30', views: '750', viewCount: 750, rating: 4.3, grade: '11-12' },
  { id: 7, title: "Ohm's Law — Circuit Analysis", subject: 'Physics', language: 'English', duration: '4:44', views: '1.8k', viewCount: 1800, rating: 4.4, grade: '9-10' },
  { id: 8, title: 'French Revolution — History', subject: 'History', language: 'Hindi', duration: '5:30', views: '920', viewCount: 920, rating: 4.1, grade: '9-10' },
  { id: 9, title: 'Binary Search Algorithm', subject: 'CS', language: 'English', duration: '3:20', views: '2.0k', viewCount: 2000, rating: 4.7, grade: 'College' },
  { id: 10, title: 'Trigonometry — Sin, Cos, Tan', subject: 'Math', language: 'Marathi', duration: '4:10', views: '680', viewCount: 680, rating: 4.0, grade: '11-12' },
  { id: 11, title: 'Cell Division — Mitosis & Meiosis', subject: 'Biology', language: 'Hindi', duration: '3:45', views: '1.1k', viewCount: 1100, rating: 4.5, grade: '9-10' },
  { id: 12, title: 'Quadratic Equations — Complete Guide', subject: 'Math', language: 'Hindi', duration: '5:15', views: '1.4k', viewCount: 1400, rating: 4.6, grade: '9-10' },
];

const subjects: Subject[] = ['All', 'Math', 'Physics', 'Chemistry', 'Biology', 'CS', 'History'];
const grades: Grade[] = ['All', '6-8', '9-10', '11-12', 'College'];
const languages: Language[] = ['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Marathi'];
const sortOptions: SortOption[] = ['Latest', 'Most Viewed', 'Top Rated', 'Trending'];

// ── Star Rating helper ─────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : i - rating < 1
              ? 'fill-amber-400/50 text-amber-400'
              : 'fill-gray-200 text-gray-300 dark:fill-dark-border dark:text-dark-border'
          }`}
        />
      ))}
      <span className="text-xs text-muted ml-0.5">{rating.toFixed(1)}</span>
    </span>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
        active
          ? 'bg-saffron text-white shadow-sm'
          : 'bg-gray-100 dark:bg-dark-border text-muted hover:bg-gray-200 dark:hover:bg-dark-border/80'
      }`}
    >
      {label}
    </button>
  );
}

// ── Video Card ─────────────────────────────────────────────────────────────────

function VideoCard({ video, index }: { video: Video; index: number }) {
  const config = subjectConfig[video.subject];
  const IconComp = config.icon;

  return (
    <div
      className="group rounded-2xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail */}
      <div
        className={`relative h-40 bg-gradient-to-br ${config.gradient} overflow-hidden`}
      >
        {/* Large background icon */}
        <IconComp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white opacity-[0.12]" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15),transparent_60%)]" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-dark-surface/90 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-navy dark:text-dark-text fill-current ml-0.5" />
          </div>
        </div>

        {/* Language badge — top left */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-dark-surface/90 text-xs px-2.5 py-1 rounded-full font-medium text-navy dark:text-dark-text shadow-sm">
          {video.language}
        </div>

        {/* Duration badge — bottom right */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm text-navy dark:text-dark-text line-clamp-2 leading-snug min-h-[2.5rem]">
          {video.title}
        </h3>

        {/* Subject pill */}
        <span
          className={`inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.pill}`}
        >
          {video.subject}
        </span>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-muted">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs">{video.views}</span>
          </div>
          <StarRating rating={video.rating} />
        </div>

        {/* Generate similar — appears on hover */}
        <div className="h-0 group-hover:h-8 overflow-hidden transition-all duration-300 ease-out">
          <Link
            href="/generate"
            className="inline-flex items-center gap-1 text-saffron text-xs font-medium mt-2 hover:underline"
          >
            Generate similar
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6">
        <Search className="w-9 h-9 text-muted" />
      </div>
      <h3 className="text-xl font-heading font-semibold text-navy dark:text-dark-text mb-2">
        Koi video nahi mila
      </h3>
      <p className="text-muted text-sm mb-6 max-w-xs">
        Is topic par pehli video generate karo!
      </p>
      <Link href="/generate" className="btn-saffron text-sm">
        <Sparkles className="w-4 h-4" />
        Generate Video
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function LibraryPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('All');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('All');
  const [sort, setSort] = useState<SortOption>('Latest');
  const [sortOpen, setSortOpen] = useState(false);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filteredVideos = useMemo(() => {
    let list = [...mockVideos];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.subject.toLowerCase().includes(q)
      );
    }

    // Subject
    if (selectedSubject !== 'All') {
      list = list.filter((v) => v.subject === selectedSubject);
    }

    // Grade
    if (selectedGrade !== 'All') {
      list = list.filter((v) => v.grade === selectedGrade);
    }

    // Language
    if (selectedLanguage !== 'All') {
      list = list.filter((v) => v.language === selectedLanguage);
    }

    // Sort
    switch (sort) {
      case 'Most Viewed':
        list.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'Top Rated':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'Trending':
        list.sort((a, b) => b.viewCount * b.rating - a.viewCount * a.rating);
        break;
      case 'Latest':
      default:
        // default order
        break;
    }

    return list;
  }, [search, selectedSubject, selectedGrade, selectedLanguage, sort]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg transition-colors duration-300">
      <div className="container-main pt-24 pb-16">
        {/* ─── HEADER ────────────────────────────────────────────────────── */}
        <header className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/30 shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-navy dark:text-dark-text">
              VidyaAI Library
            </h1>
          </div>
          <p className="text-muted text-lg mt-1 font-hindi">
            Community ke saath seekho — sabke generate kiye animated videos ek jagah
          </p>
          <p className="text-sm text-muted mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block" />
              1,247 videos
            </span>
            <span className="text-card-border dark:text-dark-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-brand inline-block" />
              22 languages
            </span>
            <span className="text-card-border dark:text-dark-border">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />
              15 subjects
            </span>
          </p>
        </header>

        {/* ─── FILTER BAR ────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="glass p-4 rounded-2xl">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Topic search karo... e.g. Integration, DNA, Newton"
                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text placeholder:text-muted/60 focus:border-saffron focus:ring-0 focus:outline-none transition-colors duration-200 text-sm font-body"
              />
            </div>

            {/* Filters row */}
            <div className="mt-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Subject chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">
                    Subject
                  </span>
                  {subjects.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={selectedSubject === s}
                      onClick={() => setSelectedSubject(s)}
                    />
                  ))}
                </div>

                {/* Grade chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">
                    Grade
                  </span>
                  {grades.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      active={selectedGrade === g}
                      onClick={() => setSelectedGrade(g)}
                    />
                  ))}
                </div>

                {/* Language chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted font-semibold mr-1">
                    Lang
                  </span>
                  {languages.map((l) => (
                    <Chip
                      key={l}
                      label={l}
                      active={selectedLanguage === l}
                      onClick={() => setSelectedLanguage(l)}
                    />
                  ))}
                </div>
              </div>

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-navy dark:text-dark-text hover:border-saffron transition-colors duration-200 cursor-pointer"
                >
                  <span className="text-muted text-xs">Sort:</span>
                  <span className="font-medium">{sort}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      sortOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {sortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSortOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-xl shadow-card-hover dark:shadow-card-dark-hover overflow-hidden z-20 animate-fade-in">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSort(opt);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                            sort === opt
                              ? 'bg-saffron/10 text-saffron font-medium'
                              : 'text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Active filter count */}
            {(selectedSubject !== 'All' ||
              selectedGrade !== 'All' ||
              selectedLanguage !== 'All' ||
              search.trim()) && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-navy dark:text-dark-text">
                    {filteredVideos.length}
                  </span>{' '}
                  video{filteredVideos.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedSubject('All');
                    setSelectedGrade('All');
                    setSelectedLanguage('All');
                  }}
                  className="text-xs text-saffron hover:underline font-medium cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── VIDEO GRID ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* ─── BOTTOM CTA ────────────────────────────────────────────────── */}
        {filteredVideos.length > 0 && (
          <div className="mt-12 text-center animate-fade-in">
            <div className="inline-flex flex-col items-center gap-3 p-8 rounded-3xl bg-gradient-to-br from-saffron-50 to-indigo-brand-50 dark:from-saffron/5 dark:to-indigo-brand/5 border border-card-border dark:border-dark-border">
              <Sparkles className="w-8 h-8 text-saffron" />
              <h3 className="font-heading font-semibold text-lg text-navy dark:text-dark-text">
                Apna video generate karo!
              </h3>
              <p className="text-muted text-sm max-w-md">
                Koi bhi topic chuno, language select karo, aur AI tumhare liye animated video banayega — bilkul free.
              </p>
              <Link href="/generate" className="btn-saffron mt-2">
                <Sparkles className="w-4 h-4" />
                Start Generating
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  BookOpen,
  Globe,
  Flame,
  Sparkles,
  ArrowRight,
  Bookmark,
  Clock,
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  Zap,
  Monitor,
} from 'lucide-react';

/* ─── Types ─── */
interface Video {
  id: number;
  title: string;
  subject: string;
  language: string;
  duration: string;
  timeAgo: string;
}

interface BookmarkItem {
  topic: string;
  subject: string;
}

interface SubjectProgress {
  subject: string;
  videos: number;
  max: number;
  color: string;
  barBg: string;
}

/* ─── Data ─── */
const SUBJECTS = [
  'All',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Computer Science',
  'English',
] as const;

const VIDEOS: Video[] = [
  { id: 1, title: 'Pythagoras Theorem', subject: 'Mathematics', language: 'Hindi', duration: '3:42', timeAgo: '2 days ago' },
  { id: 2, title: "Newton's Laws of Motion", subject: 'Physics', language: 'English', duration: '4:15', timeAgo: '3 days ago' },
  { id: 3, title: 'Periodic Table', subject: 'Chemistry', language: 'Hindi', duration: '5:01', timeAgo: '5 days ago' },
  { id: 4, title: 'Photosynthesis', subject: 'Biology', language: 'Hindi', duration: '3:55', timeAgo: '1 week ago' },
  { id: 5, title: 'Integration Basics', subject: 'Mathematics', language: 'Tamil', duration: '6:12', timeAgo: '1 week ago' },
  { id: 6, title: "Ohm's Law", subject: 'Physics', language: 'English', duration: '4:44', timeAgo: '2 weeks ago' },
];

const BOOKMARKS: BookmarkItem[] = [
  { topic: 'Binomial Theorem', subject: 'Mathematics' },
  { topic: 'DNA Structure', subject: 'Biology' },
  { topic: 'French Revolution', subject: 'History' },
  { topic: 'Quadratic Equations', subject: 'Mathematics' },
];

const PROGRESS: SubjectProgress[] = [
  { subject: 'Mathematics', videos: 8, max: 10, color: 'bg-indigo-brand', barBg: 'bg-indigo-brand/15 dark:bg-indigo-brand/25' },
  { subject: 'Physics', videos: 5, max: 10, color: 'bg-teal', barBg: 'bg-teal/15 dark:bg-teal/25' },
  { subject: 'Chemistry', videos: 3, max: 10, color: 'bg-saffron', barBg: 'bg-saffron/15 dark:bg-saffron/25' },
  { subject: 'Biology', videos: 2, max: 10, color: 'bg-success', barBg: 'bg-success/15 dark:bg-success/25' },
];

/* ─── Helpers ─── */
function getSubjectStyle(subject: string) {
  switch (subject) {
    case 'Mathematics':
      return {
        gradient: 'bg-gradient-indigo',
        pill: 'pill-indigo',
        icon: <Calculator className="w-12 h-12 text-white/20" />,
        dot: 'bg-indigo-brand',
      };
    case 'Physics':
      return {
        gradient: 'bg-gradient-teal',
        pill: 'pill-teal',
        icon: <Atom className="w-12 h-12 text-white/20" />,
        dot: 'bg-teal',
      };
    case 'Chemistry':
      return {
        gradient: 'bg-gradient-saffron',
        pill: 'pill-saffron',
        icon: <FlaskConical className="w-12 h-12 text-white/20" />,
        dot: 'bg-saffron',
      };
    case 'Biology':
      return {
        gradient: 'bg-gradient-to-br from-emerald-500 to-green-400',
        pill: 'pill-teal',
        icon: <Leaf className="w-12 h-12 text-white/20" />,
        dot: 'bg-success',
      };
    case 'History':
      return {
        gradient: 'bg-gradient-to-br from-amber-500 to-yellow-400',
        pill: 'pill-saffron',
        icon: <BookOpen className="w-12 h-12 text-white/20" />,
        dot: 'bg-amber-500',
      };
    case 'Computer Science':
      return {
        gradient: 'bg-gradient-indigo',
        pill: 'pill-indigo',
        icon: <Monitor className="w-12 h-12 text-white/20" />,
        dot: 'bg-indigo-brand',
      };
    default:
      return {
        gradient: 'bg-gradient-saffron',
        pill: 'pill-saffron',
        icon: <Sparkles className="w-12 h-12 text-white/20" />,
        dot: 'bg-muted',
      };
  }
}

/* ─── Components ─── */

function StatCard({
  icon,
  iconBg,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <div
      className="card flex items-center gap-4 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`${iconBg} w-[40px] h-[40px] rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold font-heading text-navy dark:text-dark-text">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function VideoCard({ video, delay }: { video: Video; delay: number }) {
  const style = getSubjectStyle(video.subject);

  return (
    <div
      className="group card p-0 overflow-hidden opacity-0 animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Thumbnail */}
      <div className={`relative h-36 ${style.gradient} flex items-center justify-center overflow-hidden`}>
        {/* Subject icon (decorative) */}
        {style.icon}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 dark:bg-dark-surface/90 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
            <Play className="w-5 h-5 text-saffron fill-saffron ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
          {video.duration}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h3 className="font-semibold text-navy dark:text-dark-text line-clamp-2 leading-snug group-hover:text-saffron transition-colors duration-200">
          {video.title}
        </h3>
        <div className="flex items-center flex-wrap gap-2">
          <span className={style.pill}>{video.subject}</span>
          <span className="pill bg-gray-100 dark:bg-dark-border text-muted dark:text-gray-400 text-xs">
            {video.language}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Clock className="w-3.5 h-3.5" />
          {video.timeAgo}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function DashboardPage() {
  const [activeSubject, setActiveSubject] = useState<string>('All');

  const filteredVideos =
    activeSubject === 'All' ? VIDEOS : VIDEOS.filter((v) => v.subject === activeSubject);

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg transition-colors duration-300">
      <div className="container-main pt-24 pb-16">
        {/* ───────── TOP BAR ───────── */}
        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 opacity-0 animate-fade-in-up"
          style={{ animationFillMode: 'forwards' }}
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-navy dark:text-dark-text">
              <span className="font-hindi">Namaste</span>, Arjun! 🙏
            </h1>
            <p className="text-muted mt-1 font-hindi">Aaj kya seekhna hai?</p>
          </div>
          <Link href="/generate" className="btn-saffron whitespace-nowrap self-start sm:self-auto">
            <Zap className="w-4 h-4" />
            New Video Generate Karo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ───────── STATS CARDS ───────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<Play className="w-5 h-5 text-saffron" />}
            iconBg="bg-saffron/10 dark:bg-saffron/20"
            value="24"
            label="Videos Generated"
            delay={100}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-indigo-brand" />}
            iconBg="bg-indigo-brand/10 dark:bg-indigo-brand/20"
            value="18"
            label="Topics Covered"
            delay={200}
          />
          <StatCard
            icon={<Globe className="w-5 h-5 text-teal" />}
            iconBg="bg-teal/10 dark:bg-teal/20"
            value="3"
            label="Languages Used"
            delay={300}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-saffron" />}
            iconBg="bg-saffron/10 dark:bg-saffron/20"
            value="7 days 🔥"
            label="Learning Streak"
            delay={400}
          />
        </section>

        {/* ───────── SUBJECT FILTER TABS ───────── */}
        <section
          className="mb-8 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setActiveSubject(subject)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeSubject === subject
                      ? 'bg-saffron text-white shadow-saffron'
                      : 'text-muted hover:text-navy dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-surface'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── CONTENT AREA ───────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main: Recent Videos ── */}
          <section className="flex-1 lg:w-2/3">
            <h2
              className="section-heading text-xl !mb-5 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              Recent Videos
            </h2>

            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((video, i) => (
                  <VideoCard key={video.id} video={video} delay={450 + i * 80} />
                ))}
              </div>
            ) : (
              <div
                className="card text-center py-16 opacity-0 animate-fade-in-up"
                style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}
              >
                <Sparkles className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-muted font-heading">
                  No videos in <span className="font-semibold text-navy dark:text-dark-text">{activeSubject}</span> yet.
                </p>
                <Link href="/generate" className="text-saffron font-semibold text-sm mt-2 inline-flex items-center gap-1 hover:underline">
                  Generate one now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>

          {/* ── Sidebar ── */}
          <aside className="lg:w-1/3 space-y-6">
            {/* Bookmarked Topics */}
            <div
              className="card opacity-0 animate-fade-in-up"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
            >
              <h3 className="font-heading font-semibold text-lg text-navy dark:text-dark-text mb-4 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-saffron" />
                <span className="font-hindi">Baad mein dekhna hai</span> 🔖
              </h3>
              <ul className="space-y-3">
                {BOOKMARKS.map((item) => {
                  const style = getSubjectStyle(item.subject);
                  return (
                    <li
                      key={item.topic}
                      className="flex items-center justify-between group/bm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                        <span className="text-sm text-navy dark:text-dark-text truncate">
                          {item.topic}
                        </span>
                      </div>
                      <Link
                        href="/generate"
                        className="text-saffron text-sm font-medium flex items-center gap-1 whitespace-nowrap opacity-70 group-hover/bm:opacity-100 transition-opacity duration-200"
                      >
                        Generate karo
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Progress Chart */}
            <div
              className="card opacity-0 animate-fade-in-up"
              style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
            >
              <h3 className="font-heading font-semibold text-lg text-navy dark:text-dark-text mb-5">
                Subject Progress
              </h3>
              <div className="space-y-4">
                {PROGRESS.map((p) => (
                  <div key={p.subject} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-muted truncate flex-shrink-0">{p.subject}</span>
                    <div className={`flex-1 h-3 rounded-full ${p.barBg} overflow-hidden`}>
                      <div
                        className={`h-full rounded-full ${p.color} transition-all duration-700 ease-out`}
                        style={{ width: `${(p.videos / p.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted font-mono w-16 text-right flex-shrink-0">
                      {p.videos} videos
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-card-border dark:border-dark-border">
                <span className="pill-indigo text-xs">
                  <Sparkles className="w-3 h-3" />
                  Sabse zyada: Mathematics
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

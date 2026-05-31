'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Eye, Calendar, User, BookOpen, Languages, GraduationCap, Bookmark, Download, Check, FileText } from 'lucide-react';
import GeneratedVideoPlayer from '@/components/generated-video-player';
import type { Scene } from '@/components/scene-renderer';
import QuizPanel from '@/components/watch/quiz-panel';
import DoubtChat from '@/components/watch/doubt-chat';
import CommentsSection from '@/components/watch/comments-section';
import RatingStars from '@/components/watch/rating-stars';
import ShareButton from '@/components/watch/share-button';
import AddToPlaylist from '@/components/watch/add-to-playlist';
import RelatedVideos from '@/components/watch/related-videos';

interface ScriptLine { time: string; text: string }

interface VideoDetail {
  id: string;
  topic: string;
  language: string;
  grade: string;
  subject: string;
  voiceType: string;
  videoStyle: string;
  duration: number;
  createdAt: string;
  author: string;
  views: number;
  script: ScriptLine[];
  scene: Scene | null;
  manimCode: string;
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/library/${id}`);
        if (!res.ok) {
          if (!cancelled) setError(res.status === 404 ? 'Video not found' : 'Failed to load video');
          return;
        }
        const data = await res.json();
        if (!cancelled) setVideo(data);
      } catch {
        if (!cancelled) setError('Failed to load video');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch bookmark status once the user is known to be logged in.
  useEffect(() => {
    if (!id || authStatus !== 'authenticated') return;
    let cancelled = false;
    fetch(`/api/videos/${id}/bookmark`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBookmarked(!!d.bookmarked); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, authStatus]);

  const toggleBookmark = async () => {
    if (authStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/library/${id}`)}`);
      return;
    }
    setBookmarkBusy(true);
    try {
      const res = await fetch(`/api/videos/${id}/bookmark`, { method: 'POST' });
      const d = await res.json();
      setBookmarked(!!d.bookmarked);
    } catch { /* ignore */ } finally {
      setBookmarkBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!video) return;
    if (authStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/library/${id}`)}`);
      return;
    }
    // Record the download server-side (counts toward streak + stats).
    fetch(`/api/videos/${id}/download`, { method: 'POST' }).catch(() => {});

    // Build a self-contained text file: script + Manim source.
    const lines = [
      `VidyaAI — ${video.topic}`,
      `Language: ${video.language}  |  Grade: ${video.grade}  |  Subject: ${video.subject}`,
      '',
      '═══════════════ SCRIPT ═══════════════',
      ...video.script.map(l => `[${l.time}] ${l.text}`),
      '',
      '═══════════════ MANIM SOURCE ═══════════════',
      video.manimCode || '(none)',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  // Open a clean, printable notes view → user picks "Save as PDF" in the print dialog.
  const handlePdf = () => {
    if (!video) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = video.script
      .map(l => `<tr><td class="t">${l.time}</td><td>${l.text.replace(/</g, '&lt;')}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${video.topic} — VidyaAI Notes</title>
      <style>
        *{box-sizing:border-box} body{font-family:Georgia,serif;color:#1A1A2E;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.6}
        h1{color:#FF6B2C;font-size:28px;margin-bottom:4px} .meta{color:#6B6B80;font-size:13px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse} td{padding:8px 10px;vertical-align:top;border-bottom:1px solid #eee;font-size:14px}
        td.t{color:#FF6B2C;font-family:monospace;font-size:12px;width:60px;white-space:nowrap}
        .brand{margin-top:32px;color:#6B6B80;font-size:12px;text-align:center}
        @media print{body{margin:0}}
      </style></head><body>
      <h1>${video.topic}</h1>
      <div class="meta">${video.subject} · ${video.language} · Class ${video.grade} · VidyaAI</div>
      <table>${rows}</table>
      <div class="brand">Generated by VidyaAI — Har topic, har bhasha, har student</div>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`);
    w.document.close();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-off-white dark:bg-dark-bg">
        <div className="container-main pt-24 pb-16">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 dark:bg-dark-border rounded mb-6" />
            <div className="aspect-video bg-gray-200 dark:bg-dark-border rounded-2xl mb-6" />
            <div className="h-10 w-2/3 bg-gray-200 dark:bg-dark-border rounded mb-3" />
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-dark-border rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="min-h-screen bg-off-white dark:bg-dark-bg">
        <div className="container-main pt-24 pb-16 text-center">
          <h1 className="text-3xl font-heading font-bold text-navy dark:text-dark-text mb-3">
            {error ?? 'Something went wrong'}
          </h1>
          <p className="text-muted mb-6">The video you are looking for could not be loaded.</p>
          <Link href="/library" className="btn-saffron inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg">
      <div className="container-main pt-24 pb-16">

        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-saffron transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* Player + title column */}
          <div>
            <GeneratedVideoPlayer
              topic={video.topic}
              script={video.script}
              language={video.language}
              scene={video.scene}
              onWatchTracked={() => {
                // Record a watch the first time playback starts (fire-and-forget).
                fetch(`/api/videos/${video.id}/watch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ duration: 0, completed: false }),
                }).catch(() => {});
              }}
            />

            <div className="mt-6">
              <h1 className="text-3xl font-heading font-bold text-navy dark:text-dark-text leading-tight">
                {video.topic}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {video.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {video.views} views
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {new Date(video.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Transcript */}
            <details className="mt-8 group">
              <summary className="cursor-pointer text-sm font-semibold text-navy dark:text-dark-text hover:text-saffron transition-colors">
                Show full transcript ({video.script.length} lines)
              </summary>
              <div className="mt-4 space-y-2 p-5 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
                {video.script.map((line, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-muted shrink-0 w-12 pt-0.5">{line.time}</span>
                    <p className="text-navy dark:text-dark-text">{line.text}</p>
                  </div>
                ))}
              </div>
            </details>

            {/* Quiz */}
            <QuizPanel topic={video.topic} language={video.language} script={video.script} />

            {/* Doubt-solving chatbot */}
            <DoubtChat topic={video.topic} language={video.language} script={video.script} />

            {/* Comments */}
            <CommentsSection videoId={video.id} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={toggleBookmark}
                disabled={bookmarkBusy}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 disabled:opacity-50 ${
                  bookmarked
                    ? 'bg-saffron/10 border-saffron text-saffron'
                    : 'border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-saffron' : ''}`} />
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron transition-all duration-200"
              >
                {downloaded ? <Check className="w-4 h-4 text-teal" /> : <Download className="w-4 h-4" />}
                {downloaded ? 'Saved!' : 'Download'}
              </button>
            </div>

            <ShareButton topic={video.topic} />
            <AddToPlaylist videoId={video.id} />

            <button
              onClick={handlePdf}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron transition-all"
            >
              <FileText className="w-4 h-4" /> Notes (PDF)
            </button>

            <RatingStars videoId={video.id} />

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Video info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-saffron shrink-0" />
                  <dt className="text-muted w-20 shrink-0">Subject</dt>
                  <dd className="font-medium text-navy dark:text-dark-text">{video.subject}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-indigo-brand shrink-0" />
                  <dt className="text-muted w-20 shrink-0">Language</dt>
                  <dd className="font-medium text-navy dark:text-dark-text">{video.language}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal shrink-0" />
                  <dt className="text-muted w-20 shrink-0">Grade</dt>
                  <dd className="font-medium text-navy dark:text-dark-text">{video.grade}</dd>
                </div>
              </dl>
            </div>

            <Link
              href="/generate"
              className="block p-5 rounded-2xl bg-gradient-to-br from-saffron/10 to-indigo-brand/10 border border-card-border dark:border-dark-border hover:border-saffron transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-saffron mb-1">Make your own</p>
              <h4 className="font-heading font-semibold text-navy dark:text-dark-text">Generate a custom video</h4>
              <p className="text-xs text-muted mt-1">Pick any topic + language. AI does the rest.</p>
            </Link>

            <RelatedVideos currentId={video.id} subject={video.subject} />
          </aside>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Calendar, User, BookOpen, Languages, GraduationCap } from 'lucide-react';
import GeneratedVideoPlayer from '@/components/generated-video-player';
import type { Scene } from '@/components/scene-renderer';

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
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
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
          </aside>
        </div>
      </div>
    </main>
  );
}

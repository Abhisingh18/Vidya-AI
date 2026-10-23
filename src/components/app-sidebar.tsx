'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Sparkles, Library, Clapperboard, Bookmark, ListVideo,
  LogOut, Sun, Moon, Menu, X, Presentation, ClipboardList, NotebookPen,
  Wrench, Users, ScrollText, Camera, Layers, FileText, ClipboardCheck, CalendarDays, Trophy,
} from 'lucide-react';
import { useTheme } from './theme-provider';
import Logo from '@/components/brand/logo';
import { homeForRole, parseRole } from '@/lib/roles';
import type { ProgressSummary } from '@/lib/badges';
import { useXpSummary, XpPill } from './student/xp-pill';

const studentSections = [
  {
    title: 'Learn',
    links: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Generate',  href: '/generate',  icon: Sparkles },
      { name: 'Library',   href: '/library',   icon: Library },
      { name: 'Shorts',    href: '/shorts',    icon: Clapperboard },
    ],
  },
  {
    title: 'Practice',
    links: [
      { name: 'Ask a Doubt',    href: '/doubts',     icon: Camera },
      { name: 'Flashcards',     href: '/flashcards', icon: Layers },
      { name: 'Revision Notes', href: '/notes',      icon: FileText },
      { name: 'Mock Tests',     href: '/practice',   icon: ClipboardCheck },
      { name: 'Study Planner',  href: '/planner',    icon: CalendarDays },
    ],
  },
  {
    title: 'My stuff',
    links: [
      { name: 'My Classes',   href: '/classes',      icon: Users },
      { name: 'Saved',        href: '/bookmarks',    icon: Bookmark },
      { name: 'Playlists',    href: '/playlists',    icon: ListVideo },
      { name: 'Achievements', href: '/achievements', icon: Trophy },
    ],
  },
];

const teacherSections = [
  {
    title: 'Teach',
    links: [
      { name: 'Dashboard',    href: '/teacher',              icon: LayoutDashboard },
      { name: 'Slides',       href: '/teacher/slides',       icon: Presentation },
      { name: 'Quizzes',      href: '/teacher/quizzes',      icon: ClipboardList },
      { name: 'Lesson Plans', href: '/teacher/lesson-plans', icon: NotebookPen },
      { name: 'Exam Papers',  href: '/teacher/exams',        icon: ScrollText },
      { name: 'Toolkit',      href: '/teacher/toolkit',      icon: Wrench },
    ],
  },
  {
    title: 'Classroom',
    links: [
      { name: 'My Classes', href: '/teacher/classes', icon: Users },
    ],
  },
  {
    title: 'Explore',
    links: [
      { name: 'Library',        href: '/library',  icon: Library },
      { name: 'Generate Video', href: '/generate', icon: Sparkles },
      { name: 'Shorts',         href: '/shorts',   icon: Clapperboard },
    ],
  },
];

// '/teacher' must not light up for '/teacher/slides', so the dashboard roots match exactly.
function isActive(pathname: string | null, href: string) {
  if (href === '/teacher' || href === '/dashboard') return pathname === href;
  return pathname === href || !!pathname?.startsWith(`${href}/`);
}

function SidebarContent({ onNavigate, xp }: { onNavigate?: () => void; xp?: ProgressSummary | null }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const user = session?.user;
  const role = parseRole((user as { role?: string } | undefined)?.role);
  const sections = role === 'TEACHER' ? teacherSections : studentSections;

  return (
    <div className="flex h-full flex-col">
      <Link href={homeForRole(role)} onClick={onNavigate} className="group flex items-center gap-2 px-5 h-16 shrink-0">
        <Logo size={36} />
      </Link>

      <nav aria-label="App navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.links.map(({ name, href, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                        active
                          ? 'bg-saffron/10 text-saffron dark:bg-saffron/20'
                          : 'text-navy/70 dark:text-dark-text/70 hover:text-navy dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-saffron" />}
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-card-border dark:border-dark-border p-3 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy/70 dark:text-dark-text/70 hover:text-navy dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border transition-colors duration-200"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
          {user?.image ? (
            <Image src={user.image} alt="" width={36} height={36} className="rounded-full shrink-0" />
          ) : (
            <div className="w-9 h-9 shrink-0 rounded-full bg-saffron flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy dark:text-dark-text truncate">{user?.name}</p>
            {role === 'STUDENT' && xp ? (
              <XpPill summary={xp} onNavigate={onNavigate} />
            ) : (
              <p className="text-xs text-muted truncate">
                <span className={`font-semibold ${role === 'TEACHER' ? 'text-indigo-brand' : 'text-saffron'}`}>
                  {role === 'TEACHER' ? 'Teacher' : 'Student'}
                </span>
                {user?.email && !user.email.endsWith('@guest.vidyaai') && <> · {user.email}</>}
              </p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-200"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Navigation for signed-in students: a fixed left sidebar on desktop, and a
// slim top bar with a slide-in drawer below the lg breakpoint.
export default function AppSidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const isStudent = !!session?.user && parseRole((session.user as { role?: string }).role) === 'STUDENT';
  const xp = useXpSummary(isStudent);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <>
      <aside className="hidden lg:block print:!hidden fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-surface border-r border-card-border dark:border-dark-border">
        <SidebarContent xp={xp} />
      </aside>

      <header className="lg:hidden print:hidden fixed top-0 inset-x-0 z-40 h-16 glass shadow-nav dark:shadow-nav-dark flex items-center justify-between px-4">
        <Link href="/dashboard" className="group flex items-center gap-2">
          <Logo size={32} />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border text-navy dark:text-dark-text"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        <div className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-dark-surface shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-3.5 right-3 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border text-navy dark:text-dark-text"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent xp={xp} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </>
  );
}

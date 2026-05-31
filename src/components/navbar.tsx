'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, Sun, Moon, Flame, ArrowRight, LogOut, ChevronDown } from 'lucide-react';

// Shown to visitors (marketing pages)
const publicLinks = [
  { name: 'Home',       href: '/' },
  { name: 'Shorts',     href: '/shorts' },
  { name: 'Vision',     href: '/vision' },
  { name: 'About',      href: '/about' },
  { name: 'Contact',    href: '/contact' },
];

// Shown to logged-in students (the app itself)
const privateLinks = [
  { name: 'Dashboard',  href: '/dashboard' },
  { name: 'Generate',   href: '/generate' },
  { name: 'Shorts',     href: '/shorts' },
  { name: 'Library',    href: '/library' },
  { name: 'Saved',      href: '/bookmarks' },
  { name: 'Playlists',  href: '/playlists' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoggedIn = !!session;
  // Logged-in students see the app navigation; visitors see the marketing pages.
  const navLinks = isLoggedIn ? privateLinks : publicLinks;

  // The Shorts feed is a full-screen immersive experience — hide the global chrome.
  const immersive = pathname?.startsWith('/shorts');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const close = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);

  // The Shorts feed is full-screen immersive — render no global navbar.
  // (Placed after all hooks to satisfy the Rules of Hooks.)
  if (immersive) return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass shadow-nav dark:shadow-nav-dark' : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/30 group-hover:shadow-saffron transition-shadow duration-300">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-saffron">
                Vidya<span className="text-navy dark:text-dark-text">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-saffron/10 text-saffron dark:bg-saffron/20'
                      : 'text-navy/70 dark:text-dark-text/70 hover:text-navy dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border transition-all duration-200 text-navy dark:text-dark-text"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              {status === 'loading' ? (
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-border animate-pulse" />
              ) : isLoggedIn ? (
                <>
                  {/* Avatar with user name */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setUserMenuOpen(o => !o)}
                      className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-card-border dark:border-dark-border hover:border-saffron transition-all duration-200"
                    >
                      {session?.user?.image ? (
                        <Image src={session.user.image} alt={session.user.name ?? 'User'} width={28} height={28} className="rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-saffron flex items-center justify-center text-white text-xs font-bold">
                          {session?.user?.name?.[0] ?? 'U'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-navy dark:text-dark-text max-w-[100px] truncate">
                        {session?.user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-xl shadow-card-hover overflow-hidden z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-card-border dark:border-dark-border">
                          <p className="text-sm font-semibold text-navy dark:text-dark-text truncate">{session?.user?.name}</p>
                          <p className="text-xs text-muted truncate">{session?.user?.email}</p>
                        </div>
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border">
                          📊 Dashboard
                        </Link>
                        <Link href="/generate" className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border">
                          ⚡ Generate Video
                        </Link>
                        <Link href="/library" className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border">
                          📚 Library
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Direct Sign Out button — always visible */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 text-sm font-medium transition-all duration-200"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-saffron text-white text-sm font-semibold hover:bg-saffron-500 hover:shadow-saffron hover:scale-[1.02] transition-all duration-200"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border text-navy dark:text-dark-text"
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
        <div className={`absolute top-0 right-0 w-[280px] h-full bg-white dark:bg-dark-surface shadow-2xl transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 pt-20 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  pathname === link.href ? 'bg-saffron/10 text-saffron' : 'text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-card-border dark:border-dark-border space-y-3">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-2">
                    {session?.user?.image ? (
                      <Image src={session.user.image} alt="" width={36} height={36} className="rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-saffron flex items-center justify-center text-white font-bold">{session?.user?.name?.[0]}</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy dark:text-dark-text truncate">{session?.user?.name}</p>
                      <p className="text-xs text-muted truncate">{session?.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-red-500">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="w-full flex items-center justify-center gap-2 btn-saffron">
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text">
                {theme === 'dark' ? <><Sun className="w-4 h-4" /> Light Mode</> : <><Moon className="w-4 h-4" /> Dark Mode</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

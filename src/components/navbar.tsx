'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';
import { useSession } from 'next-auth/react';
import { Menu, X, Sun, Moon, Flame, ArrowRight } from 'lucide-react';
import AppSidebar from './app-sidebar';
import { usesAppSidebar } from './app-shell';
import { homeForRole, parseRole } from '@/lib/roles';

// Shown to visitors (marketing pages)
const publicLinks = [
  { name: 'Home',       href: '/' },
  { name: 'Shorts',     href: '/shorts' },
  { name: 'Vision',     href: '/vision' },
  { name: 'About',      href: '/about' },
  { name: 'Contact',    href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // The Shorts feed is a full-screen immersive experience — hide the global chrome.
  const immersive = pathname?.startsWith('/shorts');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  // The Shorts feed is full-screen immersive — render no global navbar.
  // (Placed after all hooks to satisfy the Rules of Hooks.)
  if (immersive) return null;

  // Inside the app, signed-in users get the vertical sidebar instead of the top bar.
  if (usesAppSidebar(pathname, !!session)) return <AppSidebar />;

  // Signed-in users on marketing pages get a way back into the app instead of "Sign In".
  const cta = session
    ? { href: homeForRole(parseRole((session.user as { role?: string } | undefined)?.role)), label: 'Dashboard' }
    : { href: '/login', label: 'Sign In' };

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
              {publicLinks.map(link => (
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
              ) : (
                <Link
                  href={cta.href}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-saffron text-white text-sm font-semibold hover:bg-saffron-500 hover:shadow-saffron hover:scale-[1.02] transition-all duration-200"
                >
                  {cta.label}
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
            {publicLinks.map(link => (
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
              <Link href={cta.href} className="w-full flex items-center justify-center gap-2 btn-saffron">
                {cta.label} <ArrowRight className="w-4 h-4" />
              </Link>

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

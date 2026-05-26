'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';
import {
  Menu,
  X,
  Sun,
  Moon,
  Flame,
  ArrowRight,
} from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Generate', href: '/generate' },
  { name: 'Library', href: '/library' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'About', href: '/about' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHindi, setIsHindi] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glass shadow-nav dark:shadow-nav-dark'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="VidyaAI Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/30 group-hover:shadow-saffron transition-shadow duration-300">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-saffron">
                Vidya<span className="text-navy dark:text-dark-text">AI</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
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

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={() => setIsHindi(!isHindi)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-card-border dark:border-dark-border hover:border-saffron dark:hover:border-saffron transition-all duration-200 text-navy dark:text-dark-text"
                aria-label="Toggle language"
              >
                {isHindi ? 'EN' : 'हिं'}
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border transition-all duration-200 text-navy dark:text-dark-text"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px]" />
                ) : (
                  <Moon className="w-[18px] h-[18px]" />
                )}
              </button>

              {/* CTA Button */}
              <Link
                href="/generate"
                className="hidden sm:inline-flex btn-saffron !px-5 !py-2 text-sm"
              >
                Shuru Karo
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-border transition-all text-navy dark:text-dark-text"
                aria-label="Toggle menu"
                aria-expanded={isMobileOpen}
              >
                {isMobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 w-[280px] h-full bg-white dark:bg-dark-surface shadow-2xl transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 pt-20">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-saffron/10 text-saffron'
                      : 'text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-card-border dark:border-dark-border">
              <Link href="/generate" className="btn-saffron w-full text-center">
                Shuru Karo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setIsHindi(!isHindi)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text"
              >
                {isHindi ? '🇬🇧 English' : '🇮🇳 हिंदी'}
              </button>
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" /> Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" /> Dark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

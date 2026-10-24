'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/logo';
import type { SVGProps } from 'react';
import { Heart, Mail } from 'lucide-react';

// lucide-react has no brand icons, so these are drawn inline.
const Github = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
);
const Linkedin = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" /></svg>
);

export default function Footer() {
  const pathname = usePathname();
  // Hidden on the immersive Shorts feed.
  if (pathname?.startsWith('/shorts')) return null;

  return (
    <footer className="print:hidden bg-navy dark:bg-dark-bg border-t border-dark-border">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <Link href="/" className="group mb-4 flex items-center gap-2">
              <Logo size={36} onDark />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Animated lessons, reels and teaching tools in 23 Indian languages — built for every student and teacher in Bharat.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { icon: Github, href: 'https://github.com/Abhisingh18', label: 'GitHub — Abhishek Singh' },
                { icon: Linkedin, href: 'https://www.linkedin.com/in/abhisheksingh500/', label: 'LinkedIn — Abhishek Singh' },
                { icon: Mail, href: 'mailto:hello@vidyaai.app', label: 'Email' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="w-9 h-9 rounded-lg border border-dark-border flex items-center justify-center text-gray-400 hover:text-saffron hover:border-saffron transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Vision', href: '/vision' },
                { name: 'About', href: '/about' },
                { name: 'Contact', href: '/contact' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-saffron transition-colors duration-200 text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Resources */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {[
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
                { name: 'Help Center', href: '/contact' },
                { name: 'Status', href: '#' },
              ].map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-saffron transition-colors duration-200 text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center sm:text-left">
            © {new Date().getFullYear()} VidyaAI · All rights reserved
          </p>
          <p className="text-gray-500 text-sm flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
            Made with <Heart className="w-3.5 h-3.5 text-saffron fill-saffron" /> for Bharat 🇮🇳 · Made by{' '}
            <a href="https://github.com/Abhisingh18" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-300 hover:text-saffron transition-colors">Abhishek Singh</a>
            <a href="https://www.linkedin.com/in/abhisheksingh500/" target="_blank" rel="noopener noreferrer" aria-label="Abhishek Singh on LinkedIn" className="text-gray-400 hover:text-saffron transition-colors"><Linkedin className="w-3.5 h-3.5" /></a>
          </p>
        </div>
      </div>
    </footer>
  );
}

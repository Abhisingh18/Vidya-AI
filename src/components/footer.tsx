'use client';

import Link from 'next/link';
import { Flame, ExternalLink, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy dark:bg-dark-bg border-t border-dark-border">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-saffron flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-saffron">
                Vidya<span className="text-white">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Professional animated teacher videos in 22 Indian languages — built for every student in Bharat.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { icon: ExternalLink, href: 'https://github.com', label: 'GitHub' },
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
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-saffron fill-saffron" /> for Bharat 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}

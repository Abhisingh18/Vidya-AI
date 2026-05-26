'use client';

import Link from 'next/link';
import { Flame, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy dark:bg-dark-bg border-t border-dark-border">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1 - Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-saffron flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-saffron">
                Vidya<span className="text-white">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              &quot;Har topic, har bhasha, har student&quot;
            </p>
            <p className="text-gray-500 text-sm font-hindi">
              Seekho — apni bhasha mein
            </p>
            <div className="mt-4 pill-saffron text-xs">
              🎓 Bodhan AI Mission ke saath
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Generate Video', href: '/generate' },
                { name: 'Video Library', href: '/library' },
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'About', href: '/about' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-saffron transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Tech */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Built With
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Claude API (Anthropic)', color: 'text-saffron' },
                { name: 'Manim Community', color: 'text-indigo-brand-300' },
                { name: 'AI4Bharat IndicF5', color: 'text-teal-300' },
                { name: 'FFmpeg', color: 'text-gray-400' },
                { name: 'Next.js + Tailwind', color: 'text-gray-400' },
              ].map((tech) => (
                <li key={tech.name} className={`text-sm ${tech.color}`}>
                  {tech.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Inspired By */}
          <div>
            <h3 className="text-white font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              Inspired By
            </h3>
            <ul className="space-y-3">
              {[
                'Bodhan AI — IIT Madras',
                'AI4Bharat — IIT Madras',
                '3Blue1Brown — Grant Sanderson',
                'Open Source Community',
              ].map((name) => (
                <li key={name} className="text-gray-400 text-sm">
                  {name}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-dark-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              Inspired by Bodhan AI, IIT Madras · Open Source · India 🇮🇳
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-saffron fill-saffron" /> for Bharat
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

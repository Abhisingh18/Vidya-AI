'use client';

import { useState } from 'react';
import { Share2, Link2, Check, MessageCircle } from 'lucide-react';

interface Props { topic: string }

export default function ShareButton({ topic }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = `Check out this VidyaAI lesson: ${topic}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: topic, text, url }); return; } catch { /* fall through */ }
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative">
      <button
        onClick={nativeShare}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-card-border dark:border-dark-border text-navy dark:text-dark-text hover:border-saffron transition-all"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 p-2 bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-xl shadow-card-hover z-20 space-y-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border"
          >
            <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
          </a>
          <button onClick={copy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-navy dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border">
            {copied ? <><Check className="w-4 h-4 text-teal" /> Copied!</> : <><Link2 className="w-4 h-4" /> Copy link</>}
          </button>
        </div>
      )}
    </div>
  );
}

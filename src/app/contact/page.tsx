
'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, MapPin, ExternalLink, Globe, AtSign, CheckCircle, Loader2 } from 'lucide-react';

const TOPICS = ['General Inquiry', 'Partnership', 'Bug Report', 'Feature Request', 'Press / Media', 'Other'];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    setName(''); setEmail(''); setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg pt-28 pb-20">
      <div className="container-main max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" />
            Get in touch
          </div>
          <h1 className="text-5xl font-heading font-bold text-navy dark:text-dark-text leading-tight">Let&apos;s talk</h1>
          <p className="text-lg text-muted mt-4 max-w-xl mx-auto">
            Questions, ideas, partnerships, or feedback — we read every message.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left — Info cards */}
          <aside className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-saffron" />
              </div>
              <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-1">Email us</h3>
              <p className="text-sm text-muted mb-2">For any inquiry, drop us a line.</p>
              <a href="mailto:hello@vidyaai.app" className="text-saffron text-sm font-medium hover:underline">hello@vidyaai.app</a>
            </div>

            <div className="card">
              <div className="w-10 h-10 rounded-xl bg-indigo-brand/10 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-indigo-brand" />
              </div>
              <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-1">Based in India</h3>
              <p className="text-sm text-muted">Remote-first team. Built by Indians, for Bharat 🇮🇳</p>
            </div>

            <div className="card">
              <h3 className="font-heading font-semibold text-navy dark:text-dark-text mb-3">Follow us</h3>
              <div className="flex gap-3">
                {[
                  { icon: ExternalLink, href: 'https://github.com', label: 'GitHub' },
                  { icon: Globe, href: 'https://vidyaai.app', label: 'Website' },
                  { icon: AtSign, href: 'https://twitter.com', label: 'Twitter' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-10 h-10 rounded-xl border border-card-border dark:border-dark-border flex items-center justify-center text-muted hover:text-saffron hover:border-saffron transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="card bg-gradient-mission dark:bg-gradient-mission-dark border-saffron/20">
              <p className="text-sm text-navy dark:text-dark-text leading-relaxed">
                <span className="font-heading font-semibold text-saffron">Quick tip:</span> If you&apos;re a teacher or student looking to use VidyaAI in your school, mention that in the topic — we&apos;ll prioritize your message.
              </p>
            </div>
          </aside>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="card space-y-5">
              {submitted && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success animate-fade-in">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-heading font-semibold text-sm">Message sent!</p>
                    <p className="text-sm opacity-80">We&apos;ll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Aarav Patel"
                    className="w-full h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">What&apos;s this about?</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        topic === t
                          ? 'bg-saffron text-white shadow-saffron'
                          : 'bg-white dark:bg-dark-surface border border-card-border dark:border-dark-border text-muted hover:border-saffron/40'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">Your message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all duration-200 text-sm resize-none"
                />
                <p className="text-xs text-muted mt-2">{message.length} characters</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim() || !message.trim()}
                className="w-full btn-saffron h-[52px] disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-xs text-muted text-center">
                We typically respond within 24 hours, Mon–Fri.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

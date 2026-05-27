'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession, getProviders } from 'next-auth/react';
import Link from 'next/link';
import { Flame, ArrowRight, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const urlError = searchParams.get('error');

  const [hasGoogle, setHasGoogle] = useState(false);
  const [mode, setMode] = useState<'choose' | 'guest'>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProviders().then(p => setHasGoogle(!!p?.google));
  }, []);

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await signIn('guest', {
      name: name.trim(),
      email: email.trim(),
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) setError('Sign-in failed. Please try again.');
    else if (res?.ok) router.replace(callbackUrl);
  };

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg flex items-center justify-center px-4 py-16">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-saffron/10 rounded-full blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-brand/10 rounded-full blur-[130px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/40">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-heading font-bold text-saffron">
            Vidya<span className="text-navy dark:text-dark-text">AI</span>
          </span>
        </Link>

        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-card-hover border border-card-border dark:border-dark-border p-8">

          {/* URL error */}
          {urlError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {urlError === 'OAuthSignin' || urlError === 'OAuthCallback'
                  ? 'Google sign-in failed — please use the guest option below or check your OAuth setup.'
                  : 'Sign-in error. Please try again.'}
              </div>
            </div>
          )}

          {mode === 'choose' ? (
            <>
              <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text text-center">Welcome back</h1>
              <p className="text-muted text-sm text-center mt-2">Sign in to start generating videos and track your progress.</p>

              <div className="mt-7 space-y-3">
                {hasGoogle && (
                  <>
                    <button
                      onClick={() => signIn('google', { callbackUrl })}
                      className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-surface text-navy dark:text-dark-text font-medium hover:border-saffron hover:bg-saffron/5 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border dark:border-dark-border" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-dark-surface px-3 text-muted">or</span></div>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setMode('guest')}
                  className="w-full btn-saffron h-12"
                >
                  <UserPlus className="w-4 h-4" />
                  Continue as Guest
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-muted text-center mt-4">
                  No password required. Your progress is saved instantly.
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setMode('choose')}
                className="text-xs text-muted hover:text-saffron mb-4 transition-colors"
              >
                ← Back
              </button>

              <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text">Quick guest sign-in</h1>
              <p className="text-muted text-sm mt-2">No password. Your progress is saved to this device.</p>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleGuest} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                    Your name <span className="text-saffron">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Aarav Patel"
                    required
                    autoFocus
                    className="w-full h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2">
                    Email <span className="text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm"
                  />
                  <p className="text-xs text-muted mt-1.5 flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 text-muted shrink-0" />
                    Add an email if you want to come back to your account later
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className="w-full btn-saffron h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  ) : (
                    <>Start Learning <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          By continuing you agree to VidyaAI&apos;s{' '}
          <Link href="#" className="text-saffron hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="#" className="text-saffron hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-off-white dark:bg-dark-bg">
        <Loader2 className="w-8 h-8 text-saffron animate-spin" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

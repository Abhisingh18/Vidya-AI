'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Flame, ArrowRight, Loader2, AlertCircle, GraduationCap, Presentation, Eye, EyeOff, LogOut } from 'lucide-react';
import { homeForRole, type Role } from '@/lib/roles';

const ROLES: { id: Role; label: string; hint: string; icon: typeof GraduationCap }[] = [
  { id: 'STUDENT', label: 'Student', hint: 'Watch & generate lessons', icon: GraduationCap },
  { id: 'TEACHER', label: 'Teacher', hint: 'Slides, quizzes & classes', icon: Presentation },
];

// Error codes NextAuth returns from the password provider (see src/lib/auth.ts)
const SIGN_IN_ERRORS: Record<string, string> = {
  CredentialsSignin: 'Wrong email or password.',
  NoPassword: 'This account was made with the old guest login and has no password yet. Tap "Sign up" and use the same email to set one — your data stays.',
  DatabaseError: "Our servers can't reach the database right now. Please try again in a few minutes.",
};

const inputCls =
  'w-full h-12 px-4 rounded-xl border-2 border-card-border dark:border-dark-border bg-white dark:bg-dark-bg text-navy dark:text-dark-text focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all text-sm';
const labelCls = 'block text-sm font-heading font-semibold text-navy dark:text-dark-text mb-2';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<Role>(searchParams.get('as') === 'teacher' ? 'TEACHER' : 'STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSignedIn, setJustSignedIn] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl');
  const sessionRole = (session?.user as { role?: Role } | undefined)?.role ?? 'STUDENT';

  // Right after logging in here (or when sent here to log in first), continue on.
  // Opening /login while already signed in shows a "signed in as…" card instead,
  // so it never silently jumps to the dashboard.
  useEffect(() => {
    if (status === 'authenticated' && (justSignedIn || callbackUrl)) {
      router.replace(callbackUrl ?? homeForRole(sessionRole));
    }
  }, [status, justSignedIn, callbackUrl, sessionRole, router]);

  const switchMode = (m: 'login' | 'signup') => { setMode(m); setError(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Could not create your account. Please try again.');
          return;
        }
      }
      const res = await signIn('password', { email, password, redirect: false });
      const [code, accountRole] = (res?.error ?? '').split(':');
      if (code === 'NoPassword') {
        // Old guest account: sign up with the same email, keeping its role.
        setMode('signup');
        setRole(accountRole === 'TEACHER' ? 'TEACHER' : 'STUDENT');
      }
      if (res?.error) setError(SIGN_IN_ERRORS[code] ?? 'Sign-in failed. Please try again.');
      else setJustSignedIn(true); // the session effect above redirects
    } catch {
      // signIn rejects when the auth endpoint is unreachable or returns non-JSON
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg flex items-center justify-center px-4 py-16">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-saffron/10 rounded-full blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-brand/10 rounded-full blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron/40">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-heading font-bold text-saffron">
            Vidya<span className="text-navy dark:text-dark-text">AI</span>
          </span>
        </Link>

        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-card-hover border border-card-border dark:border-dark-border p-8">
          {status === 'loading' || (status === 'authenticated' && (justSignedIn || callbackUrl)) ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-saffron animate-spin" /></div>
          ) : status === 'authenticated' ? (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-saffron flex items-center justify-center text-white text-xl font-bold">
                {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <h1 className="text-xl font-heading font-bold text-navy dark:text-dark-text mt-4">You&apos;re already signed in</h1>
              <p className="text-sm text-muted mt-1">
                as <b className="text-navy dark:text-dark-text">{session?.user?.name}</b>
                {session?.user?.email && !session.user.email.endsWith('@guest.vidyaai') && <> · {session.user.email}</>}
                {' '}({sessionRole === 'TEACHER' ? 'Teacher' : 'Student'})
              </p>
              <button type="button" onClick={() => router.push(homeForRole(sessionRole))} className="w-full btn-saffron h-12 mt-6">
                Continue to {sessionRole === 'TEACHER' ? 'teacher workspace' : 'dashboard'} <ArrowRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full h-12 mt-3 rounded-full border-2 border-card-border dark:border-dark-border text-navy dark:text-dark-text font-medium flex items-center justify-center gap-2 hover:border-saffron hover:text-saffron transition-colors">
                <LogOut className="w-4 h-4" /> Sign out and use another account
              </button>
            </div>
          ) : (<>
          <div role="tablist" className="grid grid-cols-2 p-1 rounded-2xl bg-gray-100 dark:bg-dark-bg mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => switchMode(m)}
                className={`h-10 rounded-xl text-sm font-heading font-semibold transition-all ${
                  mode === m ? 'bg-white dark:bg-dark-surface shadow-card text-navy dark:text-dark-text' : 'text-muted hover:text-navy dark:hover:text-dark-text'
                }`}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted text-sm mt-1">
            {mode === 'login' ? 'Log in with your email and password.' : 'Free forever for students and teachers.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <p className={labelCls}>I am a</p>
                  <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-2">
                    {ROLES.map(({ id, label, hint, icon: Icon }) => (
                      <button key={id} type="button" role="radio" aria-checked={role === id} onClick={() => setRole(id)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all ${
                          role === id ? 'border-saffron bg-saffron/5 text-saffron' : 'border-card-border dark:border-dark-border text-navy/60 dark:text-dark-text/60 hover:border-saffron/40'
                        }`}>
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-heading font-semibold">{label}</span>
                        <span className="text-[11px] text-muted leading-tight">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="name" className={labelCls}>Your name</label>
                  <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Patel"
                    required maxLength={80} autoComplete="name" className={inputCls} />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com"
                required autoComplete="email" autoFocus className={inputCls} />
            </div>

            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} required minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-navy dark:hover:text-dark-text">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-saffron h-12 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Logging in…' : 'Creating account…'}</>
              ) : (
                <>{mode === 'login' ? 'Log in' : `Sign up as ${role === 'TEACHER' ? 'teacher' : 'student'}`} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-sm text-muted text-center mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-saffron font-semibold hover:underline">
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
          </>)}
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

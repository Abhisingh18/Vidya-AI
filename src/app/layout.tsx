import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import AuthSessionProvider from '@/components/session-provider';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import AppShell from '@/components/app-shell';
import CursorEffect from '@/components/cursor-effect';
import ServiceWorkerRegister from '@/components/sw-register';

export const metadata: Metadata = {
  title: 'VidyaAI — Har topic, har bhasha, har student',
  description:
    'AI-powered animated educational video generation platform for Indian students. Type any topic and get professional animated teacher videos in Hindi and 21 other Indian languages.',
  keywords: [
    'VidyaAI',
    'AI education',
    'animated videos',
    'Indian languages',
    'Hindi education',
    'animated teacher',
    'educational AI',
    'India edtech',
  ],
  authors: [{ name: 'VidyaAI Team' }],
  openGraph: {
    title: 'VidyaAI — Every topic, every language, every student',
    description: 'Animated lessons with a real voice, visual reels and a teacher toolkit — in 23 Indian languages.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FF6B2C" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/* Brand fonts (tailwind font-heading / font-body); loaded at runtime so the build never fetches them */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout: applies to every page */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" />
      </head>
      <body className="font-body antialiased">
        <AuthSessionProvider>
          <ThemeProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-saffron focus:text-white focus:rounded-lg"
            >
              Skip to content
            </a>
            <CursorEffect />
            <ServiceWorkerRegister />
            <Navbar />
            <AppShell footer={<Footer />}>
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
            </AppShell>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

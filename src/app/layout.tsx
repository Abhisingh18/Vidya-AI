import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, Noto_Sans_Devanagari, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import AuthSessionProvider from '@/components/session-provider';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import CursorEffect from '@/components/cursor-effect';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-hindi',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

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
    description: 'AI-powered animated educational videos in 22 Indian languages.',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable} ${notoSansDevanagari.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#FF6B2C" />
        <link rel="icon" href="/favicon.ico" />
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
            <Navbar />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

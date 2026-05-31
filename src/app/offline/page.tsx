import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-off-white dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-6 mx-auto">
          <WifiOff className="w-9 h-9 text-muted" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-navy dark:text-dark-text mb-2">You&apos;re offline</h1>
        <p className="text-muted text-sm mb-6">Reconnect to generate new videos. Cached lessons may still be available.</p>
        <Link href="/" className="btn-saffron inline-flex">Go Home</Link>
      </div>
    </main>
  );
}

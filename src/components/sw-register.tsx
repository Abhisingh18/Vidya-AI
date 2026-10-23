'use client';

import { useEffect } from 'react';

// Registers the service worker so the app is installable + works offline.
// Not in development: a cached page from before a dev-server restart would load
// stale JS chunks and render a blank/broken page.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations()
        .then(regs => regs.forEach(r => r.unregister()))
        .catch(() => {});
      caches?.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
      return;
    }
    // Register after load so it never blocks first paint.
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}

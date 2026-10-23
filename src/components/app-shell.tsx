'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Marketing pages keep the public top navbar even for signed-in users.
const MARKETING_PATHS = ['/', '/vision', '/about', '/contact', '/login'];

/** Whether the signed-in app sidebar is shown on this page (see app-sidebar.tsx). */
export function usesAppSidebar(pathname: string | null, signedIn: boolean) {
  if (!signedIn || !pathname) return false;
  // The Shorts feed is full-screen immersive.
  return !MARKETING_PATHS.includes(pathname) && !pathname.startsWith('/shorts');
}

// Offsets page content for the signed-in sidebar. The marketing footer is only
// shown where the sidebar isn't (landing pages, and every page when signed out).
export default function AppShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const withSidebar = usesAppSidebar(pathname, status === 'authenticated');

  return (
    <div className={withSidebar ? 'with-sidebar lg:pl-64 print:pl-0' : undefined}>
      {children}
      {!withSidebar && footer}
    </div>
  );
}

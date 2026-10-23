import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { homeForRole, parseRole } from '@/lib/roles';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Each role has its own home; send people to theirs instead of a page
  // built for the other role.
  const role = parseRole(token.role);
  const { pathname } = req.nextUrl;
  const teacherArea = pathname.startsWith('/teacher');
  if ((teacherArea && role !== 'TEACHER') || (pathname.startsWith('/dashboard') && role === 'TEACHER')) {
    return NextResponse.redirect(new URL(homeForRole(role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/generate/:path*', '/teacher/:path*', '/classes/:path*',
    // Student study tools and gamification (sign-in required)
    '/doubts/:path*', '/flashcards/:path*', '/notes/:path*', '/practice/:path*', '/planner/:path*', '/achievements/:path*',
  ],
};

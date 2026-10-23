import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { parseRole, type Role } from '@/lib/roles';

export async function currentUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: Role } | undefined;
  if (!user?.id) return null;
  return { id: user.id, role: parseRole(user.role) };
}

// For API routes: returns the user, or a 401/403 response to send back.
export async function requireUser(role?: Role) {
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  if (role && user.role !== role) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return { user } as const;
}

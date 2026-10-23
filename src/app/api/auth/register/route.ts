import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseRole } from '@/lib/roles';
import { EMAIL_RE, hashPassword, MIN_PASSWORD } from '@/lib/password';

export const dynamic = 'force-dynamic';

// POST { name, email, password, role }: create an email/password account.
// The client signs in with the same credentials right after.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim().slice(0, 80);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = parseRole(body.role);

  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (password.length < MIN_PASSWORD) return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, { status: 400 });
  if (password.length > 200) return NextResponse.json({ error: 'Password is too long.' }, { status: 400 });

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
    if (existing?.passwordHash) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    // Accounts from the old guest login have no password; signing up with that
    // email sets one and keeps the existing history.
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { name, role, passwordHash } });
    } else {
      await prisma.user.create({ data: { name, email, role, passwordHash } });
    }
  } catch (err) {
    console.error('[auth/register] database error:', err);
    return NextResponse.json({ error: "Our servers can't reach the database right now. Please try again in a few minutes." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

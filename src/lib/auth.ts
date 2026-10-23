import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { parseRole } from '@/lib/roles';
import { verifyPassword } from '@/lib/password';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email + password. Accounts are created via /api/auth/register.
    CredentialsProvider({
      id: 'password',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? '').trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;

        // NextAuth forwards a thrown error's message to the client verbatim, so a
        // raw Prisma error would leak the DB host. Log it here (Vercel logs) and
        // hand the client a stable code the login page can explain.
        let user;
        try {
          user = await prisma.user.findUnique({ where: { email } });
        } catch (err) {
          console.error('[auth] sign-in failed — database error:', err);
          throw new Error('DatabaseError');
        }
        if (!user) return null;
        // Accounts from the old guest login have no password yet: tell the
        // login page so it can send them to Sign up (which sets one, keeping their data).
        if (!user.passwordHash) throw new Error(`NoPassword:${parseRole(user.role)}`);
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return { id: user.id, name: user.name ?? email, email: user.email ?? email, image: user.image, role: user.role };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.role = parseRole((user as { role?: string }).role);
      } else if (trigger === 'update' && token.sub) {
        const fresh = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true } });
        if (fresh) token.role = parseRole(fresh.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const u = session.user as { id?: string; role?: string };
        u.id = token.sub;
        u.role = parseRole(token.role);
      }
      return session;
    },
  },
};

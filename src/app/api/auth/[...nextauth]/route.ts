import NextAuth, { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
const hasGoogle =
  googleClientId.length > 0 &&
  googleClientSecret.length > 0 &&
  !googleClientId.startsWith('your-') &&
  !googleClientSecret.startsWith('your-');

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google — only enabled if real credentials are configured
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),

    // Quick guest sign-in — no password, just a name (and optional email)
    CredentialsProvider({
      id: 'guest',
      name: 'Guest',
      credentials: {
        name: { label: 'Your Name', type: 'text' },
        email: { label: 'Email (optional)', type: 'email' },
      },
      async authorize(credentials) {
        const name = (credentials?.name ?? '').trim();
        if (!name) return null;

        const email = (credentials?.email ?? '').trim().toLowerCase()
          || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@guest.vidyaai`;

        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { name, email },
        });

        return { id: user.id, name: user.name ?? name, email: user.email ?? email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

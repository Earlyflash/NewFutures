import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

/**
 * OIDC is stubbed: we use a credentials provider for development.
 * Replace with NextAuth OIDC provider (e.g. Keycloak, Azure AD) when ready.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials (OIDC stub)",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        let user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name ?? credentials.email.split("@")[0],
              role: "EMPLOYEE",
            },
          });
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

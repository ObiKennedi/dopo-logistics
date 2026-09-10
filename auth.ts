import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// Module augmentation to add role type to NextAuth Session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" }, // Required when using Credentials provider
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        return user;
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      // Auto-verify user when created via OAuth (Google)
      if (user.email) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        } catch (err) {
          console.error("Error setting emailVerified on createUser:", err);
        }
      }
    },
    async linkAccount({ user, account }) {
      // Auto-verify account when Google account is linked
      if (account.provider === "google" && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        } catch (err) {
          console.error("Error setting emailVerified on linkAccount:", err);
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Auto-verify email for Google OAuth users
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, emailVerified: true },
          });
          if (dbUser && !dbUser.emailVerified) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }
        } catch (err) {
          console.error("Error auto-verifying Google user in signIn:", err);
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If a relative redirect URL is passed, resolve it
      if (url.startsWith("/")) {
        if (url === "/" || url.includes("/login") || url.includes("/register")) {
          return `${baseUrl}/redirect`;
        }
        return `${baseUrl}${url}`;
      }
      // If same origin
      if (new URL(url).origin === baseUrl) {
        if (url === baseUrl || url === `${baseUrl}/` || url.includes("/login") || url.includes("/register")) {
          return `${baseUrl}/redirect`;
        }
        return url;
      }
      return `${baseUrl}/redirect`;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      // If role is not yet on the token (e.g. initial Google OAuth sign in or refresh), fetch from database
      if ((!token.role || !token.id) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, emailVerified: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;

          // Ensure Google OAuth account has emailVerified set
          if (account?.provider === "google" && !dbUser.emailVerified) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() },
            });
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || "CUSTOMER";
      }
      return session;
    },
  },
});
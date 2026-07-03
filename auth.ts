import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // Every sign-in, session, and linked account is persisted to your
  // database automatically through this adapter — that's the piece
  // that "manages user data to Prisma".
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database", // sessions live in the Session table, not just a JWT
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // Expose the database user id (and any custom fields) on the session
    // object so the rest of the app can use them without an extra query.
    async session({ session, user }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string; role?: string }).id = user.id;
        (session.user as typeof session.user & { id: string; role?: string }).role = (
          user as { role?: string }
        ).role;
      }
      return session;
    },
  },
};

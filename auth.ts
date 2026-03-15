import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { assertValidAuthEnv } from "@/lib/auth-env";
import { prisma } from "@/lib/prisma";

assertValidAuthEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "database"
  },
  providers: [Google],
  pages: {
    signIn: "/signin"
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    }
  }
});

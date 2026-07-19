import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config — no providers here. Credentials + bcrypt (Node-only)
 * live in auth.ts, which must never be imported from middleware.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};

import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "ADMIN";
      email?: string | null;
      name?: string | null;
    };
  }
}

/** Edge-safe config (no adapter, no Node-only deps). Shared by middleware + auth.ts. */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/admin/login" },
  providers: [], // real providers are added in auth.ts (Node runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error role attached by the credentials authorize()
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.role = (token.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      return session;
    },
  },
} satisfies NextAuthConfig;

import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { signSession, verifySession } from "@/lib/auth/session-token";

const securePreview = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

export const authOptions: NextAuthOptions = {
  secret: process.env.MANUS_JWT_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  cookies: {
    sessionToken: {
      name: "webdev_app_session",
      options: {
        httpOnly: true,
        sameSite: securePreview ? "none" : "lax",
        path: "/",
        secure: securePreview,
      },
    },
  },
  jwt: {
    async encode({ token }) {
      if (!token?.sub) throw new Error("ไม่สามารถสร้าง session ที่ไม่มีรหัสผู้ใช้ได้");
      return signSession({
        ...token,
        sub: token.sub,
        openId: String(token.openId ?? token.sub),
        appId: String(token.appId ?? process.env.MANUS_PROJECT_ID ?? "local-dev"),
      });
    },
    async decode({ token }) {
      return (verifySession(token) as JWT | null) ?? null;
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.openId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as typeof user & { role?: string }).role ?? "TEACHER";
      }
      return token;
    },
    async session({ session, token }) {
      const mutable = session as Session & {
        user: Session["user"] & { id: string; openId: string; role: string };
      };
      if (mutable.user) {
        mutable.user.id = String(token.sub ?? token.openId ?? "");
        mutable.user.openId = String(token.openId ?? token.sub ?? "");
        mutable.user.role = String(token.role ?? "TEACHER");
        if (token.name) mutable.user.name = String(token.name);
        if (token.email) mutable.user.email = String(token.email);
      }
      return mutable;
    },
  },
  pages: { signIn: "/login" },
};

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      openId: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    openId?: string;
    appId?: string;
    role?: string;
  }
}

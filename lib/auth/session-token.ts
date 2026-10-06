import { createHmac, timingSafeEqual } from "node:crypto";

export type AppToken = {
  sub: string;
  openId: string;
  appId: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
};

function secret() {
  const value = process.env.MANUS_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("กำหนด MANUS_JWT_SECRET หรือ NEXTAUTH_SECRET ก่อนใช้งานระบบเข้าสู่ระบบ");
  return value;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signature(input: string) {
  return createHmac("sha256", secret()).update(input).digest();
}

type SessionClaims = {
  sub: string;
  openId?: string;
  appId?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  [key: string]: unknown;
};

export function signSession(claims: SessionClaims) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AppToken = {
    ...claims,
    openId: claims.openId ?? claims.sub,
    appId: claims.appId ?? process.env.MANUS_PROJECT_ID ?? "local-dev",
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  const content = `${header}.${body}`;
  return `${content}.${signature(content).toString("base64url")}`;
}

export function verifySession(rawToken: string | null | undefined): AppToken | null {
  if (!rawToken) return null;
  try {
    const parts = rawToken.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: string };
    if (header.alg !== "HS256") return null;

    const expected = signature(`${encodedHeader}.${encodedPayload}`);
    const received = Buffer.from(encodedSignature, "base64url");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AppToken;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    const projectId = process.env.MANUS_PROJECT_ID;
    if (projectId && payload.appId !== projectId) return null;
    const openId = payload.openId || payload.sub;
    if (!openId) return null;
    return { ...payload, openId, sub: payload.sub || openId };
  } catch {
    return null;
  }
}

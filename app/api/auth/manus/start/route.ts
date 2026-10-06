import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const nonceCookie = "manus_oauth_nonce";

export async function GET() {
  const portal = process.env.MANUS_OAUTH_PORTAL_URL?.replace(/\/$/, "");
  const appId = process.env.MANUS_PROJECT_ID;
  const publicOrigin = process.env.NEXTAUTH_URL;
  if (!portal || !appId || !publicOrigin) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า Manus OAuth สำหรับระบบนี้" },
      { status: 503 },
    );
  }

  const redirectUri = new URL("/api/auth/manus/callback", publicOrigin).toString();
  const nonce = randomBytes(24).toString("base64url");
  const state = Buffer.from(JSON.stringify({ redirectUri, nonce }), "utf8").toString("base64");
  const authorizationUrl = new URL(`${portal}/app-auth`);
  authorizationUrl.searchParams.set("appId", appId);
  authorizationUrl.searchParams.set("redirectUri", redirectUri);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("responseType", "code");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(nonceCookie, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: publicOrigin.startsWith("https://"),
    path: "/",
    maxAge: 300,
  });
  return response;
}

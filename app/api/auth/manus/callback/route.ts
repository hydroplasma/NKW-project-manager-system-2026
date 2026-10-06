import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/auth/session-token";

const nonceCookie = "manus_oauth_nonce";
const sessionCookie = "webdev_app_session";
type ExchangeResponse = { accessToken?: string };
type ManusUser = { openId?: string; name?: string; email?: string; platforms?: string[] };

function secureCompare(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function loginError(origin: string, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, origin));
}

export async function GET(request: NextRequest) {
  const publicOrigin = process.env.NEXTAUTH_URL;
  const projectId = process.env.MANUS_PROJECT_ID;
  const api = process.env.MANUS_OAUTH_API_URL?.replace(/\/$/, "");
  if (!publicOrigin || !projectId || !api) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า Manus OAuth สำหรับระบบนี้" }, { status: 503 });
  }

  const redirectUri = new URL("/api/auth/manus/callback", publicOrigin).toString();
  const code = request.nextUrl.searchParams.get("code");
  const rawState = request.nextUrl.searchParams.get("state");
  const cookieNonce = request.cookies.get(nonceCookie)?.value;
  if (!code || !rawState || !cookieNonce) return loginError(publicOrigin, "oauth_state_invalid");

  let state: { redirectUri?: string; nonce?: string };
  try {
    state = JSON.parse(Buffer.from(rawState, "base64").toString("utf8")) as { redirectUri?: string; nonce?: string };
  } catch {
    return loginError(publicOrigin, "oauth_state_invalid");
  }
  if (state.redirectUri !== redirectUri || !state.nonce || !secureCompare(state.nonce, cookieNonce)) {
    return loginError(publicOrigin, "oauth_state_invalid");
  }

  try {
    const exchangeResponse = await fetch(`${api}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: projectId, grantType: "authorization_code", code, redirectUri }),
      cache: "no-store",
    });
    if (!exchangeResponse.ok) return loginError(publicOrigin, "oauth_exchange_failed");
    const exchanged = (await exchangeResponse.json()) as ExchangeResponse;
    if (!exchanged.accessToken) return loginError(publicOrigin, "oauth_exchange_failed");

    const profileResponse = await fetch(`${api}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken: exchanged.accessToken }),
      cache: "no-store",
    });
    if (!profileResponse.ok) return loginError(publicOrigin, "oauth_profile_failed");
    const profile = (await profileResponse.json()) as ManusUser;
    const openId = profile.openId?.trim();
    if (!openId) return loginError(publicOrigin, "oauth_profile_failed");

    const isInitialAdmin = process.env.INITIAL_ADMIN_OPEN_ID === openId;
    const user = await prisma.user.upsert({
      where: { openId },
      update: {
        name: profile.name?.trim() || "ครูผู้ใช้ระบบ",
        email: profile.email || null,
        ...(isInitialAdmin ? { role: "ADMIN" } : {}),
      },
      create: {
        openId,
        name: profile.name?.trim() || "ครูผู้ใช้ระบบ",
        email: profile.email || null,
        role: isInitialAdmin ? "ADMIN" : "TEACHER",
      },
    });

    const token = signSession({
      sub: user.openId ?? user.id,
      openId: user.openId ?? user.id,
      appId: projectId,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const secure = publicOrigin.startsWith("https://");
    const response = NextResponse.redirect(new URL("/", publicOrigin));
    response.cookies.set(sessionCookie, token, {
      httpOnly: true,
      sameSite: secure ? "none" : "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.set(nonceCookie, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Manus OAuth callback failed", error);
    return loginError(publicOrigin, "oauth_callback_failed");
  }
}

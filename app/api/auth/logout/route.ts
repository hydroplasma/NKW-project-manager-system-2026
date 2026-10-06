import { NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const secure = origin.startsWith("https://");
  const response = NextResponse.redirect(new URL("/login?signedOut=1", origin), { status: 303 });
  response.cookies.set("webdev_app_session", "", {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return response;
}

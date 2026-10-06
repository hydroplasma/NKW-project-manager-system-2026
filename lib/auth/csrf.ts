import { NextResponse } from "next/server";

export function rejectCrossOrigin(request: Request) {
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(process.env.NEXTAUTH_URL ?? "").origin;
  } catch {
    return NextResponse.json({ error: "ยังไม่ได้กำหนด public origin ของระบบ" }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }
  if (!requestOrigin || requestOrigin !== expectedOrigin) {
    return NextResponse.json({ error: "คำขอจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
  }
  return null;
}

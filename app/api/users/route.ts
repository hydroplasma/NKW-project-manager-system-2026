import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  const users = await prisma.user.findMany({ select: { id: true, openId: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  const input = z.object({ id: z.string().min(1), role: z.enum(["TEACHER", "ADMIN"]) }).safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "ข้อมูลบทบาทไม่ถูกต้อง" }, { status: 400 });
  if (input.data.id === user.id && input.data.role !== "ADMIN") return NextResponse.json({ error: "ไม่สามารถลดสิทธิ์บัญชีผู้ดูแลที่ใช้งานอยู่ได้" }, { status: 409 });
  const updated = await prisma.user.update({ where: { id: input.data.id }, data: { role: input.data.role }, select: { id: true, name: true, email: true, role: true } });
  return NextResponse.json({ user: updated });
}

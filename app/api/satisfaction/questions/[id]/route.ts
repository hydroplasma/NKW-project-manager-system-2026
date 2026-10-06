import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

const schema = z.object({ question: z.string().trim().min(5).max(500).optional(), sortOrder: z.coerce.number().int().min(1).max(500).optional(), isActive: z.boolean().optional() });
type Context = { params: Promise<{ id: string }> };

async function adminOnly() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  if (user.role !== "ADMIN") return { error: NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 }) };
  return { user };
}

export async function PATCH(request: Request, { params }: Context) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const access = await adminOnly();
  if (access.error) return access.error;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const question = await prisma.satisfactionQuestion.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ question });
}

export async function DELETE(request: Request, { params }: Context) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const access = await adminOnly();
  if (access.error) return access.error;
  const { id } = await params;
  const question = await prisma.satisfactionQuestion.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ question });
}

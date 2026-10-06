import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

const questionSchema = z.object({ question: z.string().trim().min(5).max(500), sortOrder: z.coerce.number().int().min(1).max(500).optional() });

export async function GET() {
  const user = await getCurrentUser();
  const questions = await prisma.satisfactionQuestion.findMany({ where: user?.role === "ADMIN" ? {} : { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  const parsed = questionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const highest = await prisma.satisfactionQuestion.aggregate({ _max: { sortOrder: true } });
  const question = await prisma.satisfactionQuestion.create({ data: { question: parsed.data.question, sortOrder: parsed.data.sortOrder ?? (highest._max.sortOrder ?? 0) + 1 } });
  return NextResponse.json({ question }, { status: 201 });
}

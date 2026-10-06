import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

const activityInput = z.object({
  title: z.string().trim().min(3, "กรุณาระบุชื่อกิจกรรมอย่างน้อย 3 ตัวอักษร").max(180),
  description: z.string().max(3000).optional().default(""),
  ownerName: z.string().trim().min(2).max(120),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  location: z.string().max(180).optional().default(""),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).default("PUBLIC"),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]).default("OPEN"),
  participantCount: z.coerce.number().int().min(0).max(100000).default(0),
}).superRefine((activity, context) => {
  if (activity.endsAt && activity.endsAt < activity.startsAt) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม" });
  }
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const where = {
    ...(user ? {} : { visibility: "PUBLIC" }),
    ...(status && status !== "ALL" ? { status } : {}),
    ...(search ? { OR: [{ title: { contains: search } }, { ownerName: { contains: search } }, { code: { contains: search } }] } : {}),
  };
  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { cippEvaluations: true, satisfactionResponses: true } },
    },
  });
  return NextResponse.json({ activities, sampleData: !user });
}

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเพิ่มกิจกรรม" }, { status: 401 });
  const parsed = activityInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const semester = await prisma.semester.findFirst({
    where: { startsAt: { lte: parsed.data.startsAt }, endsAt: { gte: parsed.data.startsAt } },
    include: { academicYear: true },
  });
  if (!semester) {
    return NextResponse.json({ error: "ยังไม่ได้กำหนดปีการศึกษาและภาคเรียน" }, { status: 409 });
  }
  const code = `NK-${semester.academicYear.year}-${Date.now().toString().slice(-6)}`;
  const activity = await prisma.activity.create({
    data: { ...parsed.data, code, academicYearId: semester.academicYearId, semesterId: semester.id, createdById: user.id },
  });
  return NextResponse.json({ activity }, { status: 201 });
}

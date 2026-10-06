import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().max(3000).optional(),
  ownerName: z.string().trim().min(2).max(120).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  location: z.string().max(180).optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]).optional(),
  participantCount: z.coerce.number().int().min(0).max(100000).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const user = await getCurrentUser();
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      semester: { include: { academicYear: true } },
      createdBy: { select: { name: true } },
      _count: { select: { cippEvaluations: true, satisfactionResponses: true } },
      report: { include: { signatures: true, images: true } },
    },
  });
  if (!activity || (!user && activity.visibility === "INTERNAL")) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  return NextResponse.json({ activity, sampleData: !user, canEdit: Boolean(user && (user.role === "ADMIN" || activity.createdById === user.id)) });
}

export async function PATCH(request: Request, { params }: Context) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนแก้ไขกิจกรรม" }, { status: 401 });
  const activity = await prisma.activity.findUnique({ where: { id }, select: { createdById: true, startsAt: true, endsAt: true } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  if (user.role !== "ADMIN" && activity.createdById !== user.id) return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขกิจกรรมนี้" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const startsAt = parsed.data.startsAt ?? activity.startsAt;
  const endsAt = parsed.data.endsAt === undefined ? activity.endsAt : parsed.data.endsAt;
  if (endsAt && endsAt < startsAt) return NextResponse.json({ error: "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม" }, { status: 400 });
  const data = { ...parsed.data };
  if (parsed.data.startsAt) {
    const semester = await prisma.semester.findFirst({
      where: { startsAt: { lte: parsed.data.startsAt }, endsAt: { gte: parsed.data.startsAt } },
      select: { id: true, academicYearId: true },
    });
    if (!semester) return NextResponse.json({ error: "วันที่เริ่มกิจกรรมอยู่นอกช่วงปีการศึกษาหรือภาคเรียนที่กำหนด" }, { status: 409 });
    Object.assign(data, { academicYearId: semester.academicYearId, semesterId: semester.id });
  }
  const updated = await prisma.activity.update({ where: { id }, data });
  return NextResponse.json({ activity: updated });
}

export async function DELETE(request: Request, { params }: Context) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลบกิจกรรม" }, { status: 401 });
  const activity = await prisma.activity.findUnique({ where: { id }, select: { createdById: true } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  if (user.role !== "ADMIN" && activity.createdById !== user.id) return NextResponse.json({ error: "ไม่มีสิทธิ์ลบกิจกรรมนี้" }, { status: 403 });
  await prisma.activity.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

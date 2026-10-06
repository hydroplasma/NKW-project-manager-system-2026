import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";

const roles = ["REPORTER", "VICE_PRINCIPAL", "PRINCIPAL"] as const;
const reportSchema = z.object({
  activityId: z.string().min(1),
  participantCount: z.coerce.number().int().min(0).max(100000),
  passRate: z.coerce.number().min(0).max(100),
  satisfactionLevel: z.coerce.number().min(0).max(5),
  budgetApproved: z.coerce.number().min(0),
  budgetSpent: z.coerce.number().min(0),
  strengths: z.string().max(3000),
  challenges: z.string().max(3000),
  recommendations: z.string().max(3000),
  images: z.array(z.object({ path: z.string().trim().min(1).max(2048).refine((path) => path.startsWith("/") || /^https:\/\//i.test(path), "ใช้ path ภายในระบบหรือ HTTPS URL เท่านั้น"), caption: z.string().max(300).default("") })).max(12).optional(),
  signatures: z.array(z.object({ role: z.enum(roles), fullName: z.string().trim().max(160), decision: z.enum(["PENDING", "APPROVED", "REJECTED"]) })).max(3).optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId");
  if (activityId) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { report: { include: { signatures: true, images: true } } } });
    if (!activity || (!user && activity.visibility === "INTERNAL")) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    const canEdit = Boolean(user && (user.role === "ADMIN" || activity.createdById === user.id));
    return NextResponse.json({ activity, report: activity.report, sampleData: !user, canEdit });
  }
  const reports = await prisma.activityReport.findMany({
    where: user ? {} : { activity: { visibility: "PUBLIC" } },
    include: { activity: { select: { id: true, code: true, title: true, startsAt: true, status: true } }, signatures: true, images: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ reports, sampleData: !user });
}

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนบันทึกรายงาน" }, { status: 401 });
  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลรายงานไม่ถูกต้อง" }, { status: 400 });
  const { activityId, images, signatures, ...fields } = parsed.data;
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true, createdById: true } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  if (user.role !== "ADMIN" && activity.createdById !== user.id) return NextResponse.json({ error: "เฉพาะผู้ดูแลหรือเจ้าของกิจกรรมเท่านั้นที่บันทึกรายงานได้" }, { status: 403 });
  if (fields.budgetSpent > fields.budgetApproved) return NextResponse.json({ error: "งบใช้จริงต้องไม่เกินงบที่อนุมัติ" }, { status: 400 });
  if (signatures?.length && user.role !== "ADMIN") return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขผลรับรองได้" }, { status: 403 });

  const report = await prisma.activityReport.upsert({
    where: { activityId },
    update: { ...fields, updatedById: user.id },
    create: { ...fields, activityId, updatedById: user.id },
  });
  if (images) {
    await prisma.activityImage.deleteMany({ where: { reportId: report.id } });
    if (images.length) await prisma.activityImage.createMany({ data: images.map((image, displayOrder) => ({ ...image, displayOrder, activityId, reportId: report.id })) });
  }
  for (const role of roles) {
    const signature = signatures?.find((item) => item.role === role);
    const signerData = signature ? {
      fullName: signature.fullName,
      decision: signature.decision,
      signedAt: signature.decision === "PENDING" ? null : new Date(),
    } : null;
    await prisma.approvalSignature.upsert({
      where: { reportId_role: { reportId: report.id, role } },
      update: signerData ?? {},
      create: { reportId: report.id, role, fullName: signerData?.fullName ?? "", decision: signerData?.decision ?? "PENDING", signedAt: signerData?.signedAt ?? null },
    });
  }
  const result = await prisma.activityReport.findUnique({ where: { id: report.id }, include: { signatures: true, images: true } });
  return NextResponse.json({ report: result }, { status: 201 });
}

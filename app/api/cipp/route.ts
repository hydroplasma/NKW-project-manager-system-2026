import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";
import { summarizeScores } from "@/lib/evaluation";

const dimensionLabels: Record<string, string> = {
  CONTEXT: "ด้านที่ 1 ด้านบริบท (Context Evaluation : C)",
  INPUT: "ด้านที่ 2 ด้านปัจจัยนำเข้า (Input Evaluation : I)",
  PROCESS: "ด้านที่ 3 ด้านกระบวนการ (Process Evaluation : P)",
  PRODUCT: "ด้านที่ 4 ด้านผลผลิต (Product Evaluation : P)",
};
const dimensions = ["CONTEXT", "INPUT", "PROCESS", "PRODUCT"];
const submissionSchema = z.object({
  activityId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), score: z.number().int().min(1).max(5) })).min(1),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId");
  const where = user ? {} : { visibility: "PUBLIC" };
  if (!activityId) {
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { cippEvaluations: true } } },
    });
    return NextResponse.json({ activities, authenticated: Boolean(user) });
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { _count: { select: { cippEvaluations: true } } },
  });
  if (!activity || (!user && activity.visibility === "INTERNAL")) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  const [questions, evaluations] = await Promise.all([
    prisma.cippQuestion.findMany({ where: { isActive: true }, orderBy: [{ dimension: "asc" }, { sortOrder: "asc" }] }),
    prisma.cippEvaluation.findMany({ where: { activityId }, include: { answers: { include: { question: true } } }, orderBy: { submittedAt: "desc" } }),
  ]);

  const summaries = dimensions.map((dimension) => {
    const scores = evaluations.flatMap((evaluation) => evaluation.answers.filter((answer) => answer.question.dimension === dimension).map((answer) => answer.score));
    return { key: dimension, dimension: dimensionLabels[dimension], ...summarizeScores(scores) };
  });
  const mine = user ? evaluations.find((evaluation) => evaluation.userId === user.id) : undefined;
  return NextResponse.json({
    activity,
    questions: questions.map((question) => ({ ...question, dimensionLabel: dimensionLabels[question.dimension] ?? question.dimension })),
    summaries,
    evaluationCount: evaluations.length,
    authenticated: Boolean(user),
    userEvaluation: mine ? { id: mine.id, submittedAt: mine.submittedAt, answers: mine.answers.map(({ questionId, score }) => ({ questionId, score })) } : null,
  });
}

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนส่งแบบประเมิน CIPP" }, { status: 401 });
  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลแบบประเมินไม่ถูกต้อง" }, { status: 400 });
  const { activityId, answers } = parsed.data;
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true, status: true, visibility: true } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  if (activity.status !== "OPEN") return NextResponse.json({ error: "กิจกรรมนี้ไม่ได้เปิดรับแบบประเมิน" }, { status: 409 });
  const questions = await prisma.cippQuestion.findMany({ where: { isActive: true }, select: { id: true } });
  const validIds = new Set(questions.map((question) => question.id));
  const submittedIds = answers.map((answer) => answer.questionId);
  if (submittedIds.length !== questions.length || new Set(submittedIds).size !== questions.length || submittedIds.some((id) => !validIds.has(id))) {
    return NextResponse.json({ error: "กรุณาตอบคำถาม CIPP ที่เปิดใช้งานให้ครบทุกข้อ" }, { status: 400 });
  }

  const evaluation = await prisma.$transaction(async (tx) => {
    const existing = await tx.cippEvaluation.findFirst({ where: { activityId, userId: user.id } });
    if (existing) {
      await tx.cippEvaluation.update({ where: { id: existing.id }, data: { respondentName: user.name } });
      await tx.cippAnswer.deleteMany({ where: { evaluationId: existing.id } });
      await tx.cippAnswer.createMany({ data: answers.map((answer) => ({ evaluationId: existing.id, questionId: answer.questionId, score: answer.score })) });
      return tx.cippEvaluation.findUniqueOrThrow({ where: { id: existing.id }, select: { id: true, submittedAt: true } });
    }
    return tx.cippEvaluation.create({
      data: {
        activityId,
        userId: user.id,
        respondentName: user.name,
        answers: { create: answers.map((answer) => ({ questionId: answer.questionId, score: answer.score })) },
      },
      select: { id: true, submittedAt: true },
    });
  });
  return NextResponse.json({ evaluation }, { status: 201 });
}

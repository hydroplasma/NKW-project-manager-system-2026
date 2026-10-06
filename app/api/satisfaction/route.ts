import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { rejectCrossOrigin } from "@/lib/auth/csrf";
import { summarizeScores, summarizeSatisfaction } from "@/lib/evaluation";

const submissionSchema = z.object({
  activityId: z.string().min(1),
  respondentName: z.string().trim().max(120).optional().default(""),
  suggestion: z.string().trim().max(2000).optional().default(""),
  answers: z.array(z.object({ questionId: z.string().min(1), score: z.number().int().min(1).max(5) })).min(1),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId");
  if (!activityId) {
    const where = user ? {} : { visibility: "PUBLIC" };
    const [activities, questions] = await Promise.all([
      prisma.activity.findMany({ where, orderBy: { startsAt: "desc" }, include: { _count: { select: { satisfactionResponses: true } } } }),
      prisma.satisfactionQuestion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return NextResponse.json({ activities, questions, authenticated: Boolean(user) });
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity || (!user && activity.visibility === "INTERNAL")) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  const [questions, responses] = await Promise.all([
    prisma.satisfactionQuestion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.satisfactionResponse.findMany({ where: { activityId }, include: { answers: { include: { question: true } } }, orderBy: { submittedAt: "desc" } }),
  ]);
  const summaries = questions.map((question) => {
    const scores = responses.flatMap((response) => response.answers.filter((answer) => answer.questionId === question.id).map((answer) => answer.score));
    return { questionId: question.id, question: question.question, ...summarizeScores(scores) };
  });
  const overall = summarizeSatisfaction(responses.flatMap((response) => response.answers.map((answer) => answer.score)));
  const mine = user ? responses.find((response) => response.userId === user.id) : undefined;
  return NextResponse.json({
    activity,
    questions,
    summaries,
    overall,
    responseCount: responses.length,
    authenticated: Boolean(user),
    myResponse: mine ? { id: mine.id, submittedAt: mine.submittedAt, suggestion: mine.suggestion, answers: mine.answers.map(({ questionId, score }) => ({ questionId, score })) } : null,
    suggestions: user ? responses.map(({ suggestion, respondentName, submittedAt }) => ({ suggestion, respondentName, submittedAt })).filter((item) => item.suggestion) : [],
  });
}

export async function POST(request: Request) {
  const csrfError = rejectCrossOrigin(request);
  if (csrfError) return csrfError;
  const user = await getCurrentUser();
  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลแบบประเมินไม่ถูกต้อง" }, { status: 400 });
  const { activityId, answers, suggestion } = parsed.data;
  const activity = await prisma.activity.findUnique({ where: { id: activityId }, select: { id: true, status: true, visibility: true } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  if (activity.status !== "OPEN") return NextResponse.json({ error: "กิจกรรมนี้ไม่ได้เปิดรับแบบประเมิน" }, { status: 409 });
  if (activity.visibility === "INTERNAL" && !user) return NextResponse.json({ error: "กิจกรรมภายในต้องเข้าสู่ระบบก่อนส่งแบบประเมิน" }, { status: 401 });
  const questions = await prisma.satisfactionQuestion.findMany({ where: { isActive: true }, select: { id: true } });
  const validIds = new Set(questions.map((question) => question.id));
  const ids = answers.map((answer) => answer.questionId);
  if (ids.length !== questions.length || new Set(ids).size !== questions.length || ids.some((id) => !validIds.has(id))) {
    return NextResponse.json({ error: "กรุณาตอบคำถามที่เปิดใช้งานให้ครบทุกข้อ" }, { status: 400 });
  }
  const response = await prisma.satisfactionResponse.create({
    data: {
      activityId,
      userId: user?.id,
      respondentName: user?.name || parsed.data.respondentName || "ผู้ตอบแบบประเมิน",
      suggestion,
      answers: { create: answers.map((answer) => ({ questionId: answer.questionId, score: answer.score })) },
    },
    select: { id: true, submittedAt: true },
  });
  return NextResponse.json({ response }, { status: 201 });
}

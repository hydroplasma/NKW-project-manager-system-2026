import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { summarizeScores, summarizeSatisfaction } from "@/lib/evaluation";

const thaiMonth = new Intl.DateTimeFormat("th-TH", { month: "short" });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const where = user ? {} : { visibility: "PUBLIC" };
  const now = new Date();
  const requestedMonth = new URL(request.url).searchParams.get("month");
  const match = requestedMonth?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const selectedMonth = match ? new Date(Number(match[1]), Number(match[2]) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [year, activityCount, recentActivities, calendarActivities, monthActivities, satisfactionAnswers, visibleActivities] = await Promise.all([
    prisma.academicYear.findFirst({ where: { isCurrent: true }, orderBy: { year: "desc" }, include: { semesters: { orderBy: { termNumber: "asc" } } } }),
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, code: true, startsAt: true, ownerName: true, status: true, visibility: true },
    }),
    prisma.activity.findMany({ where: { ...where, startsAt: { gte: monthStart, lt: nextMonth } }, select: { startsAt: true } }),
    prisma.activity.findMany({ where: { ...where, startsAt: { gte: sixMonthStart, lt: currentMonthEnd } }, select: { startsAt: true } }),
    prisma.satisfactionAnswer.findMany({ select: { score: true, response: { select: { activity: { select: { visibility: true } } } } } }),
    prisma.activity.findMany({ where, select: { id: true } }),
  ]);

  const monthCounts = new Map<string, number>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthCounts.set(key, 0);
  }
  for (const activity of monthActivities) {
    const date = activity.startsAt;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const monthly = [...monthCounts.entries()].map(([key, count]) => {
    const [yearNumber, monthNumber] = key.split("-").map(Number);
    return { month: thaiMonth.format(new Date(yearNumber, monthNumber, 1)), count };
  });

  const activityDays: Record<string, number> = {};
  for (const activity of calendarActivities) {
    const day = String(activity.startsAt.getDate());
    activityDays[day] = (activityDays[day] ?? 0) + 1;
  }

  const visibleActivityIds = visibleActivities.map((item) => item.id);
  const evaluationIds = visibleActivityIds.length
    ? await prisma.cippEvaluation.findMany({ where: { activityId: { in: visibleActivityIds } }, select: { id: true } })
    : [];
  const cippAnswers = evaluationIds.length
    ? await prisma.cippAnswer.findMany({ where: { evaluationId: { in: evaluationIds.map((item) => item.id) } }, select: { score: true, question: { select: { dimension: true } } } })
    : [];
  const dimensionNames: Record<string, string> = {
    CONTEXT: "บริบท",
    INPUT: "ปัจจัยนำเข้า",
    PROCESS: "กระบวนการ",
    PRODUCT: "ผลผลิต",
  };
  const cippGroups = new Map<string, number[]>();
  for (const answer of cippAnswers) {
    const values = cippGroups.get(answer.question.dimension) ?? [];
    values.push(answer.score);
    cippGroups.set(answer.question.dimension, values);
  }
  const cipp = ["CONTEXT", "INPUT", "PROCESS", "PRODUCT"].map((dimension) => ({
    dimension: dimensionNames[dimension],
    score: summarizeScores(cippGroups.get(dimension) ?? []).mean,
  }));

  const visibleSatisfactionScores = satisfactionAnswers
    .filter((answer) => user || answer.response.activity.visibility === "PUBLIC")
    .map((answer) => answer.score);
  const satisfaction = summarizeSatisfaction(visibleSatisfactionScores);
  const currentSemester = year?.semesters.find((semester) => now >= semester.startsAt && now <= semester.endsAt) ?? year?.semesters.at(-1);
  const currentSemesterLabel = currentSemester?.label ?? "—";

  return NextResponse.json({
    metrics: { semesterCount: year?.semesters.length ?? 0, academicYear: year?.year ?? 2569, termLabel: currentSemesterLabel, activityCount },
    monthly,
    activityDays,
    recentActivities,
    cipp,
    respondentCount: evaluationIds.length,
    satisfaction: { mean: satisfaction.mean, level: satisfaction.satisfactionLevel },
    sampleData: !user,
  });
}

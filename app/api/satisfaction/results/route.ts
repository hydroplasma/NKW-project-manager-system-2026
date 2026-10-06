import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { summarizeSatisfaction } from "@/lib/evaluation";

export async function GET() {
  const user = await getCurrentUser();
  const activities = await prisma.activity.findMany({ where: user ? {} : { visibility: "PUBLIC" }, orderBy: { startsAt: "desc" }, select: { id: true, code: true, title: true, startsAt: true, status: true } });
  const ids = activities.map((activity) => activity.id);
  const responses = ids.length ? await prisma.satisfactionResponse.findMany({ where: { activityId: { in: ids } }, include: { answers: { select: { score: true } } } }) : [];
  const result = activities.map((activity) => {
    const activityResponses = responses.filter((response) => response.activityId === activity.id);
    const scores = activityResponses.flatMap((response) => response.answers.map((answer) => answer.score));
    return { ...activity, responseCount: activityResponses.length, ...summarizeSatisfaction(scores) };
  });
  return NextResponse.json({ results: result, sampleData: !user });
}

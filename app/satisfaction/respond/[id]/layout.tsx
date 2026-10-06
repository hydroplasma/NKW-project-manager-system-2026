import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

type Props = { children: ReactNode; params: Promise<{ id: string }> };

export default async function SatisfactionRespondLayout({ children, params }: Props) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id }, select: { visibility: true } });
  if (!activity) notFound();
  if (activity.visibility === "INTERNAL") await requireUser();
  return children;
}

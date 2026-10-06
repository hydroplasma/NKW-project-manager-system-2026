import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const openId = session?.user?.openId || session?.user?.id;
  if (!openId) return null;

  const existing = await prisma.user.findUnique({ where: { openId } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      openId,
      name: session.user?.name?.trim() || "ครูผู้ใช้ระบบ",
      email: session.user?.email || null,
      role: "TEACHER",
    },
  });
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

import type { ReactNode } from "react";
import { requireAdmin, requireUser } from "@/lib/auth/guards";

export async function UserRoute({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}

export async function AdminRoute({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}

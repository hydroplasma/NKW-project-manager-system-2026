import type { ReactNode } from "react";
import { AdminRoute } from "@/components/layout/route-guards";

export default function SatisfactionManageLayout({ children }: { children: ReactNode }) {
  return <AdminRoute>{children}</AdminRoute>;
}

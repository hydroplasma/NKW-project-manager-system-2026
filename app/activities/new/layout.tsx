import type { ReactNode } from "react";
import { UserRoute } from "@/components/layout/route-guards";

export default function NewActivityLayout({ children }: { children: ReactNode }) {
  return <UserRoute>{children}</UserRoute>;
}

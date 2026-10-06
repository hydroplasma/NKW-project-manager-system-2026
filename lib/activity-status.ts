export const activityStatusLabel: Record<string, string> = {
  DRAFT: "ฉบับร่าง",
  OPEN: "เปิดรับประเมิน",
  CLOSED: "ปิดรับประเมิน",
  COMPLETED: "เสร็จสิ้น",
};

export function activityTone(status: string): "green" | "red" | "blue" | "amber" | "violet" | "slate" {
  if (status === "OPEN") return "blue";
  if (status === "COMPLETED") return "green";
  if (status === "CLOSED") return "slate";
  return "amber";
}

export function visibilityLabel(visibility: string) {
  return visibility === "INTERNAL" ? "ภายใน" : "สาธารณะ";
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ReportEditor, type ReportData } from "@/components/reports/report-editor";
import { Card, PageHeading } from "@/components/ui/primitives";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery<ReportData>({
    queryKey: ["report", id],
    queryFn: async () => {
      const response = await fetch(`/api/reports?activityId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "โหลดรายงานไม่สำเร็จ");
      return result;
    },
  });
  if (isLoading) return <Card className="p-8 text-sm text-slate-500">กำลังโหลดรายงาน…</Card>;
  if (isError || !data) return <Card className="p-8 text-center text-sm text-rose-700">ไม่พบรายงาน <Link href="/reports" className="mt-3 block font-bold text-blue-800">กลับหน้ารายงาน</Link></Card>;
  return <div>
    <PageHeading eyebrow="รายงานผลการดำเนินงาน" title={data.activity.title} description={data.canEdit ? "บันทึก KPI งบประมาณ ผลการดำเนินงาน รูปภาพ และส่วนรับรอง" : "ดู KPI งบประมาณ ผลการดำเนินงาน รูปภาพ และส่วนรับรอง"} action={<Link href="/reports" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"><ArrowLeft size={15} /> กลับรายงาน</Link>} />
    <ReportEditor key={data.report?.id ?? data.activity.id} data={data} />
  </div>;
}

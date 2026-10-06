"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Badge, Card, EmptyState, Input, PageHeading, buttonClass } from "@/components/ui/primitives";
import { activityStatusLabel, activityTone, visibilityLabel } from "@/lib/activity-status";
import { formatDate, formatNumber } from "@/lib/format";

type ActivityRow = {
  id: string; code: string; title: string; startsAt: string; ownerName: string;
  status: string; visibility: string; createdBy?: { name: string } | null;
  _count: { cippEvaluations: number; satisfactionResponses: number };
};

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data, isLoading, isError } = useQuery<{ activities: ActivityRow[]; sampleData: boolean }>({
    queryKey: ["activities", search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status !== "ALL") params.set("status", status);
      const response = await fetch(`/api/activities?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดรายการกิจกรรมไม่สำเร็จ");
      return response.json();
    },
  });

  return <div>
    <PageHeading eyebrow="โครงการและกิจกรรม" title="จัดการกิจกรรม" description="ดูสถานะ ผู้รับผิดชอบ และจำนวนผู้ตอบแบบประเมินของแต่ละกิจกรรม" action={<Link href="/activities/new" className={buttonClass("primary", "md")}><Plus size={16} /> เพิ่มกิจกรรม</Link>} />
    {data?.sampleData ? <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">กำลังแสดงกิจกรรมตัวอย่างแบบอ่านอย่างเดียว · เข้าสู่ระบบเพื่อเพิ่ม แก้ไข หรือลบ</div> : null}
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input aria-label="ค้นหากิจกรรม" className="pl-9" placeholder="ค้นหาชื่อกิจกรรม ผู้รับผิดชอบ หรือรหัส" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select aria-label="กรองตามสถานะ" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"><option value="ALL">ทุกสถานะ</option><option value="OPEN">เปิดรับประเมิน</option><option value="COMPLETED">เสร็จสิ้น</option><option value="CLOSED">ปิดรับประเมิน</option><option value="DRAFT">ฉบับร่าง</option></select>
      </div>
      {isLoading ? <div className="p-8 text-center text-sm text-slate-500">กำลังโหลดรายการ…</div> : isError ? <EmptyState title="โหลดข้อมูลไม่สำเร็จ" description="ตรวจสอบการเชื่อมต่อฐานข้อมูลแล้วลองใหม่" /> : !data?.activities.length ? <EmptyState title="ไม่พบกิจกรรม" description="ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" /> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-bold text-slate-500"><tr><th className="px-5 py-3">วันที่</th><th className="px-5 py-3">ชื่อกิจกรรม</th><th className="px-5 py-3">ผู้รับผิดชอบ</th><th className="px-5 py-3">การมองเห็น</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-center">ผู้ตอบ</th><th className="px-5 py-3">ผู้สร้าง</th></tr></thead><tbody className="divide-y divide-slate-100">{data.activities.map((activity) => <tr key={activity.id} className="transition hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(activity.startsAt)}</td><td className="px-5 py-4"><Link href={`/activities/${activity.id}`} className="font-bold text-slate-800 hover:text-blue-800">{activity.title}</Link><span className="mt-1 block text-[10px] text-slate-400">{activity.code}</span></td><td className="px-5 py-4 text-xs text-slate-600">{activity.ownerName}</td><td className="px-5 py-4"><Badge tone={activity.visibility === "INTERNAL" ? "violet" : "slate"}>{visibilityLabel(activity.visibility)}</Badge></td><td className="px-5 py-4"><Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge></td><td className="px-5 py-4 text-center text-xs font-semibold text-slate-700">{formatNumber(activity._count.cippEvaluations + activity._count.satisfactionResponses)}</td><td className="px-5 py-4 text-xs text-slate-500">{activity.createdBy?.name ?? "ข้อมูลตัวอย่าง"}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{data.activities.map((activity) => <Link key={activity.id} href={`/activities/${activity.id}`} className="block p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><CalendarDays size={18} /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{activity.title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(activity.startsAt)} · {activity.ownerName}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge><Badge tone={activity.visibility === "INTERNAL" ? "violet" : "slate"}>{visibilityLabel(activity.visibility)}</Badge><span className="self-center text-[10px] text-slate-500">ผู้ตอบ {formatNumber(activity._count.cippEvaluations + activity._count.satisfactionResponses)} คน</span></div></div></div></Link>)}</div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">แสดง {formatNumber(data.activities.length)} กิจกรรม</div>
      </>}
    </Card>
  </div>;
}

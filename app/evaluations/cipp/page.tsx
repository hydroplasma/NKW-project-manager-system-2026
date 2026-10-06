"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardCheck, UsersRound } from "lucide-react";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui/primitives";
import { activityStatusLabel, activityTone } from "@/lib/activity-status";
import { formatDate, formatNumber } from "@/lib/format";

type Activity = { id: string; code: string; title: string; startsAt: string; status: string; _count: { cippEvaluations: number } };
export default function CippPage() {
  const { data, isLoading, isError } = useQuery<{ activities: Activity[]; authenticated: boolean }>({
    queryKey: ["cipp-activities"],
    queryFn: async () => { const response = await fetch("/api/cipp", { cache: "no-store" }); if (!response.ok) throw new Error("โหลดรายการประเมินไม่สำเร็จ"); return response.json(); },
  });
  return <div><PageHeading eyebrow="แบบประเมินโครงการ" title="ประเมินผลตาม CIPP Model" description="Context · Input · Process · Product — สรุปคะแนนเฉลี่ยและค่า S.D. ของแต่ละด้าน" />
    {data && !data.authenticated ? <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">ดูผลตัวอย่างได้โดยไม่เข้าสู่ระบบ · ต้องเข้าสู่ระบบเพื่อส่งหรือแก้ไขคะแนน</div> : null}
    {isLoading ? <Card className="p-8 text-sm text-slate-500">กำลังโหลดกิจกรรม…</Card> : isError ? <Card className="p-8 text-sm text-rose-700">โหลดข้อมูลไม่สำเร็จ</Card> : !data?.activities.length ? <Card><EmptyState title="ยังไม่มีกิจกรรม" description="เพิ่มกิจกรรมก่อนเริ่มประเมินผลโครงการ" /></Card> : <div className="grid gap-4 lg:grid-cols-2">{data.activities.map((activity) => <Link key={activity.id} href={`/evaluations/cipp/${activity.id}`} className="group"><Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900"><ClipboardCheck size={20} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge><span className="text-[10px] text-slate-400">{activity.code}</span></div><h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-800">{activity.title}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(activity.startsAt)}</p></div><ArrowRight className="mt-1 text-slate-300 group-hover:text-blue-800" size={17} /></div><div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500"><UsersRound size={14} />ผู้ประเมินแล้ว {formatNumber(activity._count.cippEvaluations)} ราย</div></Card></Link>)}</div>}
  </div>;
}

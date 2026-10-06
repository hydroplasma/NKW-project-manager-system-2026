"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Settings2, UsersRound } from "lucide-react";
import { Badge, Card, EmptyState, PageHeading } from "@/components/ui/primitives";
import { activityStatusLabel, activityTone } from "@/lib/activity-status";
import { formatDate, formatNumber } from "@/lib/format";

type Item = { id: string; code: string; title: string; startsAt: string; status: string; _count: { satisfactionResponses: number } };
export default function SatisfactionPage() {
  const { data, isLoading, isError } = useQuery<{ activities: Item[]; authenticated: boolean }>({ queryKey: ["satisfaction-activities"], queryFn: async () => { const response = await fetch("/api/satisfaction", { cache: "no-store" }); if (!response.ok) throw new Error("โหลดแบบประเมินไม่สำเร็จ"); return response.json(); } });
  return <div><PageHeading eyebrow="ความคิดเห็นผู้เข้าร่วม" title="แบบประเมินความพึงพอใจ" description="รวบรวมข้อเสนอแนะและวัดความพึงพอใจของผู้เข้าร่วมในแต่ละกิจกรรม" action={<div className="flex flex-wrap gap-2"><Link href="/satisfaction/results" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"><UsersRound size={15} /> สรุปผล</Link><Link href="/satisfaction/manage" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"><Settings2 size={15} /> จัดการคำถาม</Link></div>} />
    {data && !data.authenticated ? <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">แสดงกิจกรรมสาธารณะ · ตอบแบบประเมินได้โดยไม่เข้าสู่ระบบ</div> : null}
    {isLoading ? <Card className="p-8 text-sm text-slate-500">กำลังโหลด…</Card> : isError ? <Card className="p-8 text-sm text-rose-700">โหลดข้อมูลไม่สำเร็จ</Card> : !data?.activities.length ? <Card><EmptyState title="ยังไม่มีกิจกรรม" description="เพิ่มกิจกรรมก่อนเปิดรับแบบประเมิน" /></Card> : <div className="grid gap-4 xl:grid-cols-2">{data.activities.map((activity) => <Card key={activity.id} className="p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ClipboardList size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge><span className="text-[10px] text-slate-400">{activity.code}</span></div><h2 className="mt-2 text-base font-bold text-slate-900">{activity.title}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(activity.startsAt)} · ผู้ตอบ {formatNumber(activity._count.satisfactionResponses)} คน</p></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><Link href={`/satisfaction/respond/${activity.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800">ตอบแบบประเมิน <ArrowRight size={14} /></Link><Link href={`/satisfaction/results/${activity.id}`} className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">ดูผล</Link></div></Card>)}</div>}
  </div>;
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import { Badge, Card, PageHeading } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

type ResultData = {
  activity: { id: string; title: string };
  summaries: { questionId: string; question: string; mean: number; sd: number; count: number; quality: string; passed: boolean }[];
  overall: { mean: number; sd: number; satisfactionLevel: string };
  responseCount: number;
  suggestions: { suggestion: string; respondentName: string; submittedAt: string }[];
};
export default function SatisfactionResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery<ResultData>({ queryKey: ["satisfaction", id], queryFn: async () => { const response = await fetch(`/api/satisfaction?activityId=${encodeURIComponent(id)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "โหลดผลประเมินไม่สำเร็จ"); return result; } });
  if (isLoading) return <Card className="p-8 text-sm text-slate-500">กำลังโหลดผลสรุป…</Card>;
  if (isError || !data) return <Card className="p-8 text-center text-sm text-rose-700">ไม่พบผลประเมิน <Link href="/satisfaction/results" className="mt-3 block font-bold text-blue-800">กลับหน้าสรุป</Link></Card>;
  return <div><PageHeading eyebrow="รายละเอียดผลความพึงพอใจ" title={data.activity.title} description="คะแนนเฉลี่ยรายข้อ ค่า S.D. และข้อเสนอแนะจากผู้เข้าร่วม" action={<Link href="/satisfaction/results" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"><ArrowLeft size={15} /> กลับสรุป</Link>} />
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-xs text-slate-500">คะแนนเฉลี่ยรวม</p><p className="mt-2 text-3xl font-extrabold text-emerald-700">{data.overall.mean.toFixed(2)} <span className="text-xs font-medium text-slate-500">/ 5</span></p></Card><Card className="p-5"><p className="text-xs text-slate-500">ค่า S.D. รวม</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{data.overall.sd.toFixed(2)}</p></Card><Card className="p-5"><p className="text-xs text-slate-500">ระดับ / จำนวนผู้ตอบ</p><p className="mt-2 text-xl font-extrabold text-slate-900">{data.overall.satisfactionLevel}</p><p className="text-xs text-slate-500">{data.responseCount} ราย</p></Card></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_0.72fr]"><Card className="overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-900">ตารางสรุปผลรายข้อ</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-bold text-slate-500"><tr><th className="px-5 py-3">รายการประเมิน</th><th className="px-3 py-3 text-right">X̄</th><th className="px-3 py-3 text-right">S.D.</th><th className="px-5 py-3">ระดับความพึงพอใจ</th></tr></thead><tbody className="divide-y divide-slate-100">{data.summaries.map((summary, index) => <tr key={summary.questionId}><td className="px-5 py-4 text-xs text-slate-700">{index + 1}. {summary.question}</td><td className="px-3 py-4 text-right font-bold">{summary.mean.toFixed(2)}</td><td className="px-3 py-4 text-right text-slate-500">{summary.sd.toFixed(2)}</td><td className="px-5 py-4"><Badge tone={summary.mean >= 4 ? "green" : "amber"}>{summary.quality}</Badge></td></tr>)}</tbody></table></div></Card><Card className="p-5"><div className="flex items-center gap-2"><MessageSquareText size={17} className="text-violet-700" /><h2 className="text-sm font-bold text-slate-900">ข้อเสนอแนะ</h2></div><div className="mt-4 space-y-3">{data.suggestions.length ? data.suggestions.map((item, index) => <div key={`${item.submittedAt}-${index}`} className="rounded-xl bg-slate-50 p-3.5"><p className="text-sm leading-6 text-slate-700">{item.suggestion}</p><p className="mt-2 text-[10px] text-slate-400">{item.respondentName} · {formatDate(item.submittedAt)}</p></div>) : <p className="py-8 text-center text-xs text-slate-500">ยังไม่มีข้อเสนอแนะที่เปิดเผยได้</p>}</div></Card></div>
  </div>;
}

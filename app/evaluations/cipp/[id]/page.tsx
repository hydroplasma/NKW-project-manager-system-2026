"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ClipboardCheck, LockKeyhole, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { CippComparisonChart } from "@/components/dashboard/dashboard-charts";
import { Badge, Button, Card, PageHeading } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

type Question = { id: string; dimension: string; dimensionLabel: string; question: string; sortOrder: number };
type Summary = { key: string; dimension: string; mean: number; sd: number; count: number; quality: string; passed: boolean };
type Data = {
  activity: { id: string; title: string; status: string };
  questions: Question[];
  summaries: Summary[];
  evaluationCount: number;
  authenticated: boolean;
  userEvaluation: { id: string; submittedAt: string; answers: { questionId: string; score: number }[] } | null;
};

export default function CippDetailPage() {
  const { id } = useParams<{ id: string }>();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const { data, isLoading, isError } = useQuery<Data>({
    queryKey: ["cipp", id],
    queryFn: async () => { const response = await fetch(`/api/cipp?activityId=${encodeURIComponent(id)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "โหลดแบบประเมินไม่สำเร็จ"); return result; },
  });
  const [scores, setScores] = useState<Record<string, number>>({});
  const answers = useMemo(() => data?.userEvaluation?.answers ?? [], [data?.userEvaluation]);
  const scoreMap = useMemo(() => ({ ...Object.fromEntries(answers.map((answer) => [answer.questionId, answer.score])), ...scores }), [answers, scores]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("ไม่พบข้อมูลแบบประเมิน");
      const response = await fetch("/api/cipp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ activityId: id, answers: data.questions.map((question) => ({ questionId: question.id, score: Number(scoreMap[question.id]) })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกผลไม่สำเร็จ");
      return result;
    },
    onSuccess: async () => { setMessage("บันทึกผลการประเมินแล้ว"); setScores({}); await client.invalidateQueries({ queryKey: ["cipp", id] }); await client.invalidateQueries({ queryKey: ["cipp-activities"] }); await client.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (error: Error) => setMessage(error.message),
  });

  if (isLoading) return <Card className="p-8 text-sm text-slate-500">กำลังโหลดผลการประเมิน…</Card>;
  if (isError || !data) return <Card className="p-8 text-center text-sm text-rose-700">ไม่พบผลการประเมิน หรือไม่มีสิทธิ์ดูข้อมูลนี้ <Link href="/evaluations/cipp" className="mt-3 block font-bold text-blue-800">กลับไปรายการ</Link></Card>;
  const groups = data.questions.reduce<Record<string, Question[]>>((all, question) => { (all[question.dimension] ??= []).push(question); return all; }, {});
  const chartData = data.summaries.map((summary) => ({ dimension: summary.key === "CONTEXT" ? "บริบท" : summary.key === "INPUT" ? "ปัจจัยนำเข้า" : summary.key === "PROCESS" ? "กระบวนการ" : "ผลผลิต", score: summary.mean }));
  const complete = data.questions.every((question) => Number(scoreMap[question.id]) >= 1 && Number(scoreMap[question.id]) <= 5);

  return <div>
    <PageHeading eyebrow="แบบประเมิน CIPP Model" title={data.activity.title} description="ให้คะแนนแต่ละข้อ 1–5 โดย 1 = น้อยที่สุด และ 5 = มากที่สุด" action={<Link href="/evaluations/cipp" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><ArrowLeft size={15} /> กลับรายการ</Link>} />
    {data.userEvaluation ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><CheckCircle2 size={15} /> คุณประเมินแล้วเมื่อ {formatDate(data.userEvaluation.submittedAt)} — แก้ไขคะแนนแล้วกดบันทึกเพื่อปรับปรุงผลได้</div> : null}
    {!data.authenticated ? <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900"><span className="flex items-center gap-2"><LockKeyhole size={15} /> เข้าสู่ระบบเพื่อส่งแบบประเมินและบันทึกคะแนน</span><Link href="/login" className="font-bold underline">เข้าสู่ระบบ</Link></div> : null}
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {Object.entries(groups).map(([dimension, questions]) => <Card key={dimension} className="overflow-hidden"><div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5"><h2 className="text-sm font-bold text-slate-900">{questions[0]?.dimensionLabel}</h2></div><div className="divide-y divide-slate-100 px-5">{questions.map((question) => <div key={question.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-700">{question.question}</p><div role="radiogroup" aria-label={question.question} className="flex shrink-0 gap-1.5">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" aria-pressed={Number(scoreMap[question.id]) === score} onClick={() => setScores((current) => ({ ...current, [question.id]: score }))} className={`h-8 w-8 rounded-lg border text-xs font-bold transition ${Number(scoreMap[question.id]) === score ? "border-blue-900 bg-blue-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-900"}`}>{score}</button>)}</div></div>)}</div></Card>)}
        {message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.includes("บันทึกผล") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{message}</p> : null}
        <div className="flex justify-end"><Button disabled={!complete || !data.authenticated || mutation.isPending || data.activity.status !== "OPEN"} onClick={() => { setMessage(""); mutation.mutate(); }}><Save size={15} />{mutation.isPending ? "กำลังบันทึก…" : data.userEvaluation ? "บันทึกการแก้ไขผล" : "ส่งผลการประเมิน"}</Button></div>
      </div>
      <div className="space-y-5"><CippComparisonChart data={chartData} /><Card className="overflow-hidden"><div className="flex items-center gap-2 px-5 pb-3 pt-5"><ClipboardCheck size={17} className="text-blue-800" /><h2 className="text-sm font-bold text-slate-900">ตารางสรุปผลประเมิน</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold text-slate-500"><tr><th className="px-4 py-2.5">ด้าน</th><th className="px-3 py-2.5">X̄</th><th className="px-3 py-2.5">S.D.</th><th className="px-3 py-2.5">ระดับ</th><th className="px-3 py-2.5">ผล</th></tr></thead><tbody className="divide-y divide-slate-100">{data.summaries.map((summary) => <tr key={summary.key}><td className="px-4 py-3 text-slate-700">{({ CONTEXT: "บริบท", INPUT: "ปัจจัยนำเข้า", PROCESS: "กระบวนการ", PRODUCT: "ผลผลิต" } as Record<string, string>)[summary.key] ?? summary.dimension}</td><td className="px-3 py-3 font-semibold">{summary.mean.toFixed(2)}</td><td className="px-3 py-3 text-slate-500">{summary.sd.toFixed(2)}</td><td className="px-3 py-3 text-slate-600">{summary.quality}</td><td className="px-3 py-3"><Badge tone={summary.passed ? "green" : "red"}>{summary.passed ? "ผ่าน" : "ไม่ผ่าน"}</Badge></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">ผู้ประเมินทั้งหมด {data.evaluationCount} ราย · เกณฑ์ผ่าน X̄ ≥ 4.00</div></Card></div>
    </div>
  </div>;
}

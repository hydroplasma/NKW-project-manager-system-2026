"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Textarea, PageHeading } from "@/components/ui/primitives";
import { formatDate } from "@/lib/format";

type Data = {
  activity: { id: string; title: string; status: string; visibility: string };
  questions: { id: string; question: string; sortOrder: number }[];
  summaries: { questionId: string; question: string; mean: number; sd: number; quality: string; count: number }[];
  overall: { mean: number; sd: number; satisfactionLevel: string };
  responseCount: number;
  authenticated: boolean;
  myResponse: { id: string; submittedAt: string; suggestion: string; answers: { questionId: string; score: number }[] } | null;
};

export default function SatisfactionRespondPage() {
  const { id } = useParams<{ id: string }>();
  const client = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [respondentName, setRespondentName] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const { data, isLoading, isError } = useQuery<Data>({ queryKey: ["satisfaction", id], queryFn: async () => { const response = await fetch(`/api/satisfaction?activityId=${encodeURIComponent(id)}`, { cache: "no-store" }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "โหลดแบบประเมินไม่สำเร็จ"); return result; } });
  const priorAnswers = useMemo(() => data?.myResponse?.answers ?? [], [data?.myResponse]);
  const scoreMap = useMemo(() => ({ ...Object.fromEntries(priorAnswers.map((answer) => [answer.questionId, answer.score])), ...scores }), [priorAnswers, scores]);
  const mutation = useMutation({ mutationFn: async () => { if (!data) throw new Error("ไม่พบแบบประเมิน"); const response = await fetch("/api/satisfaction", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ activityId: id, respondentName, suggestion, answers: data.questions.map((question) => ({ questionId: question.id, score: Number(scoreMap[question.id]) })) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "ส่งแบบประเมินไม่สำเร็จ"); return result; }, onSuccess: async () => { setMessage("ขอบคุณสำหรับความคิดเห็น ระบบบันทึกผลแล้ว"); await client.invalidateQueries({ queryKey: ["satisfaction", id] }); await client.invalidateQueries({ queryKey: ["satisfaction-activities"] }); await client.invalidateQueries({ queryKey: ["satisfaction-results"] }); await client.invalidateQueries({ queryKey: ["dashboard"] }); }, onError: (error: Error) => setMessage(error.message) });

  if (isLoading) return <Card className="p-8 text-sm text-slate-500">กำลังโหลดแบบประเมิน…</Card>;
  if (isError || !data) return <Card className="p-8 text-center text-sm text-rose-700">ไม่พบกิจกรรมหรือแบบประเมิน <Link href="/satisfaction" className="mt-3 block font-bold text-blue-800">กลับหน้ารวม</Link></Card>;
  const complete = data.questions.every((question) => Number(scoreMap[question.id]) >= 1 && Number(scoreMap[question.id]) <= 5);

  return <div><PageHeading eyebrow="แบบประเมินความพึงพอใจ" title={data.activity.title} description="โปรดให้คะแนน 1–5 โดย 1 = น้อยที่สุด และ 5 = มากที่สุด" action={<Link href="/satisfaction" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"><ArrowLeft size={15} /> กลับ</Link>} />
    {data.myResponse ? <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><CheckCircle2 size={15} /> คุณตอบแบบประเมินแล้วเมื่อ {formatDate(data.myResponse.submittedAt)}</div> : null}
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]"><Card className="p-5 sm:p-7"><form onSubmit={(event) => { event.preventDefault(); setMessage(""); mutation.mutate(); }} className="space-y-6">
      {!data.authenticated ? <Field label="ชื่อผู้ตอบ (ไม่บังคับ)"><Input value={respondentName} maxLength={120} onChange={(event) => setRespondentName(event.target.value)} placeholder="เว้นว่างได้ หากต้องการไม่ระบุชื่อ" /></Field> : null}
      {data.questions.map((question, index) => <div key={question.id} className="border-b border-slate-100 pb-5 last:border-0"><p className="text-sm font-semibold text-slate-800"><span className="mr-2 text-xs font-bold text-blue-700">{index + 1}.</span>{question.question}</p><div className="mt-3 flex flex-wrap items-center gap-2">{[1, 2, 3, 4, 5].map((score) => <button type="button" key={score} aria-pressed={Number(scoreMap[question.id]) === score} onClick={() => setScores((current) => ({ ...current, [question.id]: score }))} className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition ${Number(scoreMap[question.id]) === score ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-800"}`}>{score}</button>)}</div></div>)}
      <Field label="ข้อเสนอแนะเพิ่มเติม"><Textarea maxLength={2000} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} placeholder="ข้อคิดเห็นหรือข้อเสนอแนะ (ไม่บังคับ)" /></Field>
      {message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.startsWith("ขอบคุณ") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{message}</p> : null}
      <div className="flex justify-end"><Button type="submit" disabled={!complete || mutation.isPending || data.activity.status !== "OPEN"}><Send size={15} />{mutation.isPending ? "กำลังส่ง…" : "ส่งแบบประเมิน"}</Button></div>
    </form></Card>
      <div className="space-y-4"><Card className="p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">คะแนนเฉลี่ยรวม</span><Badge tone="green">{data.overall.satisfactionLevel}</Badge></div><p className="mt-3 text-3xl font-extrabold text-emerald-700">{data.overall.mean.toFixed(2)}<span className="ml-1 text-xs font-medium text-slate-500">/ 5</span></p><p className="mt-1 text-xs text-slate-500">S.D. {data.overall.sd.toFixed(2)} · ผู้ตอบ {data.responseCount} ราย</p></Card><Card className="p-5"><h2 className="text-sm font-bold text-slate-800">สรุปรายข้อ</h2><div className="mt-3 space-y-3">{data.summaries.map((summary) => <div key={summary.questionId} className="border-t border-slate-100 pt-3"><p className="text-xs leading-5 text-slate-600">{summary.question}</p><p className="mt-1 text-xs font-bold text-emerald-800">{summary.mean.toFixed(2)} · {summary.quality} <span className="font-normal text-slate-400">(SD {summary.sd.toFixed(2)})</span></p></div>)}</div></Card></div>
    </div>
  </div>;
}

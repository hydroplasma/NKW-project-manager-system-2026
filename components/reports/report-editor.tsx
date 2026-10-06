"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ImagePlus, Save, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui/primitives";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

export type ReportData = {
  activity: { id: string; title: string; participantCount: number };
  report: null | {
    id: string; participantCount: number; passRate: number; satisfactionLevel: number;
    budgetApproved: number; budgetSpent: number; strengths: string; challenges: string;
    recommendations: string;
    signatures: { id?: string; role: string; fullName: string; decision: string; signedAt: string | null }[];
    images: { path: string; caption: string }[];
  };
  sampleData: boolean;
  canEdit: boolean;
};

type Signer = { role: "REPORTER" | "VICE_PRINCIPAL" | "PRINCIPAL"; label: string; fullName: string; decision: "PENDING" | "APPROVED" | "REJECTED"; signedAt: string | null };
const signerDefaults: Signer[] = [
  { role: "REPORTER", label: "ผู้รายงาน", fullName: "", decision: "PENDING", signedAt: null },
  { role: "VICE_PRINCIPAL", label: "รองผู้อำนวยการ", fullName: "", decision: "PENDING", signedAt: null },
  { role: "PRINCIPAL", label: "ผู้อำนวยการ", fullName: "", decision: "PENDING", signedAt: null },
];

function ReportViewer({ data }: { data: ReportData }) {
  const report = data.report;
  if (!report) return <Card className="p-6 text-sm text-slate-500">ยังไม่มีรายงานผลสำหรับกิจกรรมนี้</Card>;
  const labels: Record<Signer["role"], string> = { REPORTER: "ผู้รายงาน", VICE_PRINCIPAL: "รองผู้อำนวยการ", PRINCIPAL: "ผู้อำนวยการ" };
  return <div className="space-y-5">
    {data.sampleData ? <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">รายงานตัวอย่างสาธารณะ · โหมดอ่านอย่างเดียว</div> : null}
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-5"><p className="text-xs text-slate-500">จำนวนผู้เข้าร่วม</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{formatNumber(report.participantCount)}</p></Card>
      <Card className="p-5"><p className="text-xs text-slate-500">ผ่านการประเมิน</p><p className="mt-2 text-2xl font-extrabold text-emerald-800">{report.passRate.toFixed(1)}%</p></Card>
      <Card className="p-5"><p className="text-xs text-slate-500">ระดับความพึงพอใจ</p><p className="mt-2 text-2xl font-extrabold text-violet-800">{report.satisfactionLevel.toFixed(2)} / 5</p></Card>
    </div>
    <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold">สรุปงบประมาณ</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">งบอนุมัติ <strong className="mt-1 block text-sm text-slate-900">{formatMoney(report.budgetApproved)}</strong></p><p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">ใช้จริง <strong className="mt-1 block text-sm text-slate-900">{formatMoney(report.budgetSpent)}</strong></p><p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">คงเหลือ <strong className="mt-1 block text-sm text-emerald-900">{formatMoney(report.budgetApproved - report.budgetSpent)}</strong></p></div></Card>
    <div className="grid gap-4 lg:grid-cols-3">{[["จุดเด่น", report.strengths], ["ปัญหา / อุปสรรค", report.challenges], ["ข้อเสนอแนะ", report.recommendations]].map(([title, value]) => <Card key={title} className="p-5"><h2 className="text-sm font-bold">{title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || "—"}</p></Card>)}</div>
    <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold">ภาพกิจกรรม</h2>{report.images.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{report.images.map((image) => <figure key={image.path} className="overflow-hidden rounded-xl border border-slate-100"><img src={image.path} alt={image.caption || data.activity.title} className="max-h-72 w-full object-cover" /><figcaption className="p-3 text-xs text-slate-500">{image.caption || data.activity.title}</figcaption></figure>)}</div> : <p className="mt-3 text-sm text-slate-500">ไม่มีภาพกิจกรรม</p>}</Card>
    <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold">ส่วนรับรองรายงาน</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{signerDefaults.map((item) => { const signature = report.signatures.find((entry) => entry.role === item.role); const decision = signature?.decision ?? "PENDING"; return <div key={item.role} className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-bold text-slate-700">{labels[item.role]}</p><p className="mt-3 text-sm text-slate-800">{signature?.fullName || "—"}</p><p className="mt-2 text-xs text-slate-500">วันที่ {signature?.signedAt ? formatDate(signature.signedAt) : "—"}</p><Badge className="mt-3" tone={decision === "APPROVED" ? "green" : decision === "REJECTED" ? "red" : "amber"}>{decision === "APPROVED" ? "อนุมัติ" : decision === "REJECTED" ? "ไม่อนุมัติ" : "รอรับรอง"}</Badge></div>; })}</div></Card>
  </div>;
}

export function ReportEditor({ data }: { data: ReportData }) {
  const client = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const report = data.report;
  const [message, setMessage] = useState("");
  const [signatures, setSignatures] = useState<Signer[]>(() => signerDefaults.map((item) => {
    const saved = report?.signatures.find((signature) => signature.role === item.role);
    return saved ? { ...item, fullName: saved.fullName, decision: saved.decision as Signer["decision"], signedAt: saved.signedAt } : item;
  }));
  const [imagesText, setImagesText] = useState(() => report?.images.map((image) => `${image.path}|${image.caption}`).join("\n") ?? "");
  const [form, setForm] = useState(() => ({
    participantCount: String(report?.participantCount ?? data.activity.participantCount),
    passRate: String(report?.passRate ?? 0),
    satisfactionLevel: String(report?.satisfactionLevel ?? 0),
    budgetApproved: String(report?.budgetApproved ?? 0),
    budgetSpent: String(report?.budgetSpent ?? 0),
    strengths: report?.strengths ?? "",
    challenges: report?.challenges ?? "",
    recommendations: report?.recommendations ?? "",
  }));
  const mutation = useMutation({
    mutationFn: async () => {
      const images = imagesText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [path, ...caption] = line.split("|");
        return { path: path.trim(), caption: caption.join("|").trim() };
      });
      const payload = {
        activityId: data.activity.id,
        participantCount: Number(form.participantCount),
        passRate: Number(form.passRate),
        satisfactionLevel: Number(form.satisfactionLevel),
        budgetApproved: Number(form.budgetApproved),
        budgetSpent: Number(form.budgetSpent),
        strengths: form.strengths,
        challenges: form.challenges,
        recommendations: form.recommendations,
        images,
        ...(isAdmin ? { signatures: signatures.map(({ role, fullName, decision }) => ({ role, fullName, decision })) } : {}),
      };
      const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "บันทึกรายงานไม่สำเร็จ");
      return result;
    },
    onSuccess: async () => {
      setMessage("บันทึกรายงานเรียบร้อยแล้ว");
      await client.invalidateQueries({ queryKey: ["report", data.activity.id] });
      await client.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (!data.canEdit) return <ReportViewer data={data} />;
  return <>
    {data.sampleData ? <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">ข้อมูลตัวอย่าง · เข้าสู่ระบบด้วยบัญชีผู้ดูแลหรือผู้สร้างกิจกรรมเพื่อบันทึก</div> : null}
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold text-slate-900">KPI Achievement Tracker</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="จำนวนผู้เข้าร่วม"><Input type="number" min={0} value={form.participantCount} onChange={(e) => setForm({ ...form, participantCount: e.target.value })} /></Field><Field label="ร้อยละผ่านการประเมิน"><Input type="number" min={0} max={100} step="0.1" value={form.passRate} onChange={(e) => setForm({ ...form, passRate: e.target.value })} /></Field><Field label="ระดับความพึงพอใจ (1–5)"><Input type="number" min={0} max={5} step="0.01" value={form.satisfactionLevel} onChange={(e) => setForm({ ...form, satisfactionLevel: e.target.value })} /></Field></div></Card>
        <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><Wallet size={17} className="text-emerald-700" /><h2 className="text-sm font-bold text-slate-900">สรุปงบประมาณ</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="งบอนุมัติ (บาท)"><Input type="number" min={0} step="0.01" value={form.budgetApproved} onChange={(e) => setForm({ ...form, budgetApproved: e.target.value })} /></Field><Field label="ใช้จริง (บาท)"><Input type="number" min={0} step="0.01" value={form.budgetSpent} onChange={(e) => setForm({ ...form, budgetSpent: e.target.value })} /></Field></div><div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">คงเหลือ <strong className="ml-1">{formatMoney(Number(form.budgetApproved || 0) - Number(form.budgetSpent || 0))}</strong></div></Card>
        <Card className="space-y-4 p-5 sm:p-6"><h2 className="text-sm font-bold text-slate-900">สรุปผลการดำเนินงาน</h2><Field label="จุดเด่น (Strengths)"><Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></Field><Field label="ปัญหา / อุปสรรค (Challenges)"><Textarea value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} /></Field><Field label="ข้อเสนอแนะ (Recommendations)"><Textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></Field></Card>
        <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><ImagePlus size={17} className="text-violet-700" /><h2 className="text-sm font-bold text-slate-900">ภาพกิจกรรม</h2></div><p className="mt-1 text-xs text-slate-500">ใส่ URL HTTPS หรือ path ใน Manus Storage ทีละบรรทัด หากมีคำบรรยายใช้รูปแบบ path|คำบรรยาย</p><Textarea className="mt-3" value={imagesText} onChange={(e) => setImagesText(e.target.value)} placeholder="https://example.org/activity.jpg|ภาพรวมกิจกรรม" />{imagesText.split("\n").filter((line) => line.trim()).map((line) => { const [path, caption] = line.split("|"); return <div key={path} className="mt-3 overflow-hidden rounded-xl border border-slate-100"><img src={path} alt={caption || "ภาพกิจกรรม"} className="max-h-72 w-full object-cover" /><p className="p-2 text-xs text-slate-500">{caption || path}</p></div>; })}</Card>
        {message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.startsWith("บันทึก") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{message}{message.includes("เข้าสู่ระบบ") ? <Link className="ml-2 font-bold underline" href="/login">เข้าสู่ระบบ</Link> : null}</p> : null}
        <div className="flex justify-end"><Button disabled={mutation.isPending} onClick={() => { setMessage(""); mutation.mutate(); }}><Save size={15} />{mutation.isPending ? "กำลังบันทึก…" : "บันทึกรายงาน"}</Button></div>
      </div>
      <aside><Card className="p-5"><h2 className="text-sm font-bold text-slate-900">ส่วนรับรองรายงาน</h2><p className="mt-1 text-xs text-slate-500">ผู้รายงาน · รองผู้อำนวยการ · ผู้อำนวยการ</p>{!isAdmin ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">ข้อมูลการรับรองปรับได้โดยผู้ดูแลระบบเท่านั้น</p> : null}<div className="mt-4 space-y-4">{signatures.map((signer) => <div key={signer.role} className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-bold text-slate-700">{signer.label}</p><Input className="mt-2" disabled={!isAdmin} placeholder="ชื่อ-นามสกุล" value={signer.fullName} onChange={(e) => setSignatures((current) => current.map((item) => item.role === signer.role ? { ...item, fullName: e.target.value } : item))} /><div className="mt-3 flex flex-col gap-2 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={signer.decision === "APPROVED"} disabled={!isAdmin} onChange={(event) => setSignatures((current) => current.map((item) => item.role === signer.role ? { ...item, decision: event.target.checked ? "APPROVED" : "PENDING" } : item))} /> อนุมัติ</label><label className="flex items-center gap-2"><input type="checkbox" checked={signer.decision === "REJECTED"} disabled={!isAdmin} onChange={(event) => setSignatures((current) => current.map((item) => item.role === signer.role ? { ...item, decision: event.target.checked ? "REJECTED" : "PENDING" } : item))} /> ไม่อนุมัติ</label></div><p className="mt-2 text-[10px] text-slate-400">วันที่ {signer.signedAt ? formatDate(signer.signedAt) : signer.decision !== "PENDING" ? formatDate(new Date()) : "—"}</p></div>)}</div>{report?.signatures.length ? <div className="mt-3 flex flex-wrap gap-1">{report.signatures.map((item) => <Badge key={item.id} tone={item.decision === "APPROVED" ? "green" : item.decision === "REJECTED" ? "red" : "amber"}>{item.decision === "APPROVED" ? "อนุมัติ" : item.decision === "REJECTED" ? "ไม่อนุมัติ" : "รอรับรอง"}</Badge>)}</div> : null}</Card></aside>
    </div>
  </>;
}

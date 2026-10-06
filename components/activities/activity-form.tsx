"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui/primitives";

type ActivityValue = {
  id?: string;
  title: string;
  description?: string;
  ownerName: string;
  startsAt: string;
  endsAt?: string | null;
  location?: string;
  visibility: string;
  status: string;
  participantCount: number;
};

function inputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function toApiDate(value: string) {
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return new Date(`${withSeconds}+07:00`).toISOString();
}

export function ActivityForm({ initial, onCancelAction }: { initial?: ActivityValue; onCancelAction?: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    ownerName: initial?.ownerName ?? "",
    startsAt: inputDate(initial?.startsAt),
    endsAt: inputDate(initial?.endsAt),
    location: initial?.location ?? "",
    visibility: initial?.visibility ?? "PUBLIC",
    status: initial?.status ?? "OPEN",
    participantCount: String(initial?.participantCount ?? 0),
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const url = initial?.id ? `/api/activities/${initial.id}` : "/api/activities";
      const payload = {
        ...form,
        startsAt: toApiDate(form.startsAt),
        endsAt: form.endsAt ? toApiDate(form.endsAt) : initial?.id ? null : undefined,
        participantCount: Number(form.participantCount),
      };
      const response = await fetch(url, {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "บันทึกกิจกรรมไม่สำเร็จ");
      return result;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (onCancelAction) onCancelAction();
      else router.push(`/activities/${result.activity.id}`);
      router.refresh();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card className="p-5 sm:p-7">
      {message ? <div role="alert" className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}{message.includes("เข้าสู่ระบบ") ? <a className="ml-2 font-bold underline" href="/login">ไปหน้าเข้าสู่ระบบ</a> : null}</div> : null}
      <form onSubmit={(event) => { event.preventDefault(); setMessage(""); mutation.mutate(); }} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="ชื่อกิจกรรม"><Input required minLength={3} maxLength={180} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="ระบุชื่อกิจกรรมหรือโครงการ" /></Field>
          <Field label="ผู้รับผิดชอบ"><Input required value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="ชื่อครูหรือหน่วยงาน" /></Field>
          <Field label="วันที่และเวลา"><Input required type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} /></Field>
          <Field label="สิ้นสุด (ถ้ามี)"><Input type="datetime-local" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} /></Field>
          <Field label="สถานที่"><Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="เช่น ห้องประชุม โรงเรียน" /></Field>
          <Field label="จำนวนผู้เข้าร่วมโดยประมาณ"><Input type="number" min={0} max={100000} value={form.participantCount} onChange={(e) => update("participantCount", e.target.value)} /></Field>
          <Field label="การมองเห็น"><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}><option value="PUBLIC">สาธารณะ</option><option value="INTERNAL">ภายใน</option></select></Field>
          <Field label="สถานะ"><select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" value={form.status} onChange={(e) => update("status", e.target.value)}><option value="DRAFT">ฉบับร่าง</option><option value="OPEN">เปิดรับประเมิน</option><option value="CLOSED">ปิดรับประเมิน</option><option value="COMPLETED">เสร็จสิ้น</option></select></Field>
        </div>
        <Field label="รายละเอียด"><Textarea maxLength={3000} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="วัตถุประสงค์หรือรายละเอียดโดยย่อ" /></Field>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="secondary" onClick={onCancelAction ?? (() => router.back())}><X size={15} /> ยกเลิก</Button><Button type="submit" disabled={mutation.isPending}><Save size={15} /> {mutation.isPending ? "กำลังบันทึก…" : initial?.id ? "บันทึกการแก้ไข" : "บันทึกกิจกรรม"}</Button></div>
      </form>
    </Card>
  );
}

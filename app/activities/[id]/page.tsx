"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ClipboardCheck, FileBarChart2, MapPin, Pencil, Trash2, UsersRound } from "lucide-react";
import { useState } from "react";
import { ActivityForm } from "@/components/activities/activity-form";
import { Badge, Button, Card, PageHeading } from "@/components/ui/primitives";
import { activityStatusLabel, activityTone, visibilityLabel } from "@/lib/activity-status";
import { formatDate, formatNumber } from "@/lib/format";

type ActivityDetail = {
  id: string; code: string; title: string; description: string; ownerName: string;
  startsAt: string; endsAt: string | null; location: string; visibility: string; status: string;
  participantCount: number; createdById: string | null; canEdit: boolean;
  semester: { label: string; academicYear: { year: number } };
  createdBy: { name: string } | null;
  _count: { cippEvaluations: number; satisfactionResponses: number };
  report: { id: string } | null;
};

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { data, isLoading, isError } = useQuery<{ activity: ActivityDetail; sampleData: boolean }>({
    queryKey: ["activity", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${params.id}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "โหลดกิจกรรมไม่สำเร็จ");
      return result;
    },
  });
  const remove = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/activities/${params.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ลบกิจกรรมไม่สำเร็จ");
      return result;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["activities"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      router.push("/activities");
    },
  });

  if (isLoading) return <Card className="p-8 text-sm text-slate-500">กำลังโหลดรายละเอียดกิจกรรม…</Card>;
  if (isError || !data) return <Card className="p-8 text-center"><p className="font-semibold text-slate-800">ไม่พบกิจกรรมหรือไม่มีสิทธิ์เข้าถึง</p><Link className="mt-4 inline-block text-sm font-bold text-blue-800" href="/activities">กลับไปหน้ารายการ</Link></Card>;
  const { activity } = data;
  const respondents = activity._count.cippEvaluations + activity._count.satisfactionResponses;

  return <div>
    <PageHeading eyebrow={`กิจกรรม ${activity.code}`} title={activity.title} description={activity.description || "ยังไม่มีรายละเอียดเพิ่มเติม"} action={<Link href="/activities" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={15} /> กลับรายการ</Link>} />
    {data.sampleData ? <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800">ข้อมูลตัวอย่างแบบอ่านอย่างเดียว</div> : null}
    {editing ? <ActivityForm initial={activity} onCancelAction={() => setEditing(false)} /> : <>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2"><Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge><Badge tone={activity.visibility === "INTERNAL" ? "violet" : "slate"}>{visibilityLabel(activity.visibility)}</Badge><Badge tone="amber">ภาคเรียน {activity.semester.label}</Badge></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="flex gap-3"><CalendarDays size={18} className="mt-0.5 text-blue-800" /><div><p className="text-xs text-slate-500">วันและเวลา</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(activity.startsAt)}</p>{activity.endsAt ? <p className="text-xs text-slate-500">สิ้นสุด {formatDate(activity.endsAt)}</p> : null}</div></div>
            <div className="flex gap-3"><UsersRound size={18} className="mt-0.5 text-emerald-700" /><div><p className="text-xs text-slate-500">ผู้รับผิดชอบ</p><p className="mt-1 text-sm font-semibold text-slate-800">{activity.ownerName}</p></div></div>
            <div className="flex gap-3"><MapPin size={18} className="mt-0.5 text-orange-600" /><div><p className="text-xs text-slate-500">สถานที่</p><p className="mt-1 text-sm font-semibold text-slate-800">{activity.location || "ยังไม่ได้ระบุ"}</p></div></div>
            <div className="flex gap-3"><ClipboardCheck size={18} className="mt-0.5 text-violet-600" /><div><p className="text-xs text-slate-500">ปีการศึกษา</p><p className="mt-1 text-sm font-semibold text-slate-800">{activity.semester.academicYear.year}</p></div></div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="text-xs font-semibold text-slate-600">จำนวนผู้ตอบแบบประเมิน</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{formatNumber(respondents)} <span className="text-xs font-medium text-slate-500">รายการตอบ</span></p></div><p className="text-xs text-slate-500">ผู้เข้าร่วมตามแผน {formatNumber(activity.participantCount)} คน</p></div>
        </Card>
        <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold text-slate-900">ไปยังส่วนงาน</h2><div className="mt-4 space-y-2"><Link href={`/evaluations/cipp/${activity.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50"><span className="flex items-center gap-2"><ClipboardCheck size={16} className="text-blue-800" /> ผลประเมินโครงการ CIPP</span><span className="text-xs text-slate-400">เปิด</span></Link><Link href={`/satisfaction/respond/${activity.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"><span className="flex items-center gap-2"><UsersRound size={16} className="text-emerald-700" /> แบบประเมินความพึงพอใจ</span><span className="text-xs text-slate-400">เปิด</span></Link><Link href={`/reports/${activity.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm font-semibold text-slate-700 hover:border-violet-200 hover:bg-violet-50"><span className="flex items-center gap-2"><FileBarChart2 size={16} className="text-violet-700" /> รายงานผลและส่วนรับรอง</span><span className="text-xs text-slate-400">{activity.report ? "ดูรายงาน" : "สร้างรายงาน"}</span></Link></div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">{activity.canEdit ? <><Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={14} /> แก้ไขกิจกรรม</Button><Button variant="danger" disabled={remove.isPending} onClick={() => { if (window.confirm("ยืนยันลบกิจกรรมนี้และผลประเมินที่เกี่ยวข้อง?")) remove.mutate(); }}><Trash2 size={14} /> ลบ</Button></> : data.sampleData ? <Link href="/login" className="text-xs font-semibold text-blue-800">เข้าสู่ระบบเพื่อจัดการกิจกรรม</Link> : <span className="text-xs text-slate-500">คุณไม่มีสิทธิ์แก้ไขกิจกรรมนี้</span>}</div>
          {remove.error ? <p role="alert" className="mt-3 text-xs text-rose-700">{remove.error.message}</p> : null}
        </Card>
      </div>
    </>}
  </div>;
}

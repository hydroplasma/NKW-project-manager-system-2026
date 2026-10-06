"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Layers3, Plus, UsersRound } from "lucide-react";
import { CippComparisonChart, MonthlyActivitiesChart } from "@/components/dashboard/dashboard-charts";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { Badge, Card, CardHeader, PageHeading, buttonClass } from "@/components/ui/primitives";
import { activityStatusLabel, activityTone } from "@/lib/activity-status";
import { formatDate, formatNumber } from "@/lib/format";

type DashboardData = {
  metrics: { semesterCount: number; academicYear: number; termLabel: string; activityCount: number };
  monthly: { month: string; count: number }[];
  activityDays: Record<string, number>;
  recentActivities: { id: string; title: string; code: string; startsAt: string; ownerName: string; status: string }[];
  cipp: { dimension: string; score: number }[];
  respondentCount: number;
  satisfaction: { mean: number; level: string };
  sampleData: boolean;
};

const metrics = [
  { key: "semesterCount", title: "ภาคเรียนทั้งหมด", icon: Layers3, tone: "bg-blue-50 text-blue-800", suffix: "ภาคเรียน" },
  { key: "academicYear", title: "ปีการศึกษาปัจจุบัน", icon: GraduationCap, tone: "bg-violet-50 text-violet-700", suffix: "" },
  { key: "termLabel", title: "ชุดภาคเรียน / ปี", icon: CalendarDays, tone: "bg-amber-50 text-amber-700", suffix: "" },
  { key: "activityCount", title: "กิจกรรมทั้งหมด", icon: ClipboardList, tone: "bg-emerald-50 text-emerald-700", suffix: "กิจกรรม" },
] as const;

function LoadingDashboard() {
  return <div className="space-y-5"><div className="h-20 animate-pulse rounded-2xl bg-white" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((n) => <div key={n} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-white" /><div className="h-80 animate-pulse rounded-2xl bg-white" /></div></div>;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
      return response.json();
    },
  });

  if (isLoading) return <LoadingDashboard />;
  if (isError || !data) return <Card className="p-8 text-center"><p className="font-semibold text-rose-700">โหลดข้อมูลไม่สำเร็จ</p><p className="mt-2 text-sm text-slate-500">ตรวจสอบฐานข้อมูลและลองโหลดหน้าอีกครั้ง</p></Card>;

  return (
    <div>
      <PageHeading eyebrow="ภาพรวมการดำเนินงาน" title="แดชบอร์ด" description="ติดตามกิจกรรม โครงการ และผลการประเมินของโรงเรียนน้ำคำวิทยา" action={<Link href="/activities/new" className={buttonClass("primary", "md")}><Plus size={16} /> เพิ่มกิจกรรม</Link>} />
      {data.sampleData ? <div className="mb-5 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-800"><span className="rounded-md bg-white px-2 py-1 font-bold">ตัวอย่าง</span>กำลังแสดงข้อมูลตัวอย่างแบบอ่านอย่างเดียว กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</div> : null}

      <section className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {metrics.map(({ key, title, icon: Icon, tone, suffix }) => {
          const rawValue = data.metrics[key];
          const value = typeof rawValue === "number" ? formatNumber(rawValue) : rawValue;
          return <Card key={key} className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{title}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">{value}</p>{suffix ? <p className="mt-0.5 text-[10px] text-slate-400">{suffix}</p> : null}</div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></span></div></Card>;
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]"><MonthlyActivitiesChart data={data.monthly} /><MonthCalendar /></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <CardHeader title="กิจกรรมล่าสุด" description="รายการโครงการและกิจกรรมที่บันทึกในระบบ" action={<Link href="/activities" className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-600">ดูทั้งหมด <ArrowRight size={14} /></Link>} />
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {data.recentActivities.length ? data.recentActivities.map((activity) => (
              <Link key={activity.id} href={`/activities/${activity.id}`} className="flex items-center gap-3 py-3.5 transition hover:bg-slate-50/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><CalendarDays size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{activity.title}</span><span className="mt-1 block text-[11px] text-slate-500">{formatDate(activity.startsAt)} <span className="mx-1 text-slate-300">·</span> {activity.ownerName}</span></span>
                <Badge tone={activityTone(activity.status)}>{activityStatusLabel[activity.status] ?? activity.status}</Badge>
              </Link>
            )) : <div className="py-12 text-center text-sm text-slate-500">ยังไม่มีกิจกรรม</div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:px-6"><span className="flex items-center gap-2 text-xs text-slate-500"><UsersRound size={15} /> ผู้ส่งแบบประเมิน CIPP {formatNumber(data.respondentCount)} ราย</span><Link href="/evaluations/cipp" className="text-xs font-bold text-blue-800 hover:text-blue-600">ไปหน้าประเมิน <ArrowRight size={13} className="ml-1 inline" /></Link></div>
        </Card>
        <div className="space-y-5"><CippComparisonChart data={data.cipp} /><Card className="flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-white px-5 py-4"><div><p className="text-xs font-semibold text-emerald-800">ภาพรวมความพึงพอใจ</p><p className="mt-1 text-sm font-bold text-slate-800">{data.satisfaction.level}</p><p className="mt-1 text-[11px] text-slate-500">จากแบบประเมินที่ส่งแล้ว</p></div><div className="flex items-center gap-2"><span className="text-3xl font-extrabold text-emerald-700">{data.satisfaction.mean.toFixed(2)}</span><span className="text-xs text-slate-500">/ 5</span><CheckCircle2 className="text-emerald-500" size={20} /></div></Card></div>
      </section>
    </div>
  );
}

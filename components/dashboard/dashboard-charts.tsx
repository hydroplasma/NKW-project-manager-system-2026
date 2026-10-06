"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/ui/primitives";

export type MonthlyDatum = { month: string; count: number };
export type CippDatum = { dimension: string; score: number };

export function MonthlyActivitiesChart({ data }: { data: MonthlyDatum[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="กิจกรรมรายเดือน" description="จำนวนโครงการและกิจกรรมในปีการศึกษา 2569" action={<span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-800">6 เดือนล่าสุด</span>} />
      <div className="h-[265px] px-3 pb-5 sm:px-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#edf1f7" strokeDasharray="4 4" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip cursor={{ fill: "#f3f6fb" }} contentStyle={{ border: "1px solid #e8edf5", borderRadius: 12, fontSize: 12, boxShadow: "0 8px 20px rgba(15,23,42,.08)" }} formatter={(value) => [`${value} กิจกรรม`, "จำนวน"]} />
            <Bar dataKey="count" fill="#1e3a8a" radius={[7, 7, 2, 2]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CippComparisonChart({ data }: { data: CippDatum[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="ผลประเมิน CIPP แยกตามด้าน" description="เปรียบเทียบคะแนนเฉลี่ยกับค่าเป้าหมาย 4.00" action={<span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-0 w-5 border-t-2 border-dashed border-orange-500" /> เป้าหมาย 4.00</span>} />
      <div className="h-[270px] px-3 pb-5 sm:px-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#edf1f7" strokeDasharray="4 4" />
            <XAxis dataKey="dimension" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} dy={8} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <ReferenceLine y={4} stroke="#f97316" strokeDasharray="5 5" strokeWidth={2} />
            <Tooltip contentStyle={{ border: "1px solid #e8edf5", borderRadius: 12, fontSize: 12 }} formatter={(value) => [`${Number(value ?? 0).toFixed(2)} คะแนน`, "ค่าเฉลี่ย"]} />
            <Bar dataKey="score" fill="#10b981" radius={[7, 7, 2, 2]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

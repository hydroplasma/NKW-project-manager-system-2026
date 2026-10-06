"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/primitives";

const weekdays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
const monthTitle = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { month: "long", year: "numeric" });

type DashboardCalendarData = { activityDays: Record<string, number> };

function currentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function shiftMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthCalendar() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [year, monthNumber] = monthKey.split("-").map(Number);
  const month = new Date(year, monthNumber - 1, 1);
  const { data } = useQuery<DashboardCalendarData>({
    queryKey: ["calendar", monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?month=${encodeURIComponent(monthKey)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดปฏิทินกิจกรรมไม่สำเร็จ");
      return response.json();
    },
    staleTime: 60 * 1000,
  });
  const activityDays = data?.activityDays ?? {};
  const mondayOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const todayValues = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));

  return (
    <Card className="h-full">
      <CardHeader title="ปฏิทินกิจกรรม" description="เลือกดูวันที่มีแผนดำเนินงาน" action={<div className="flex items-center gap-1"><button onClick={() => setMonthKey(shiftMonth(monthKey, -1))} aria-label="เดือนก่อน" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft size={16} /></button><button onClick={() => setMonthKey(shiftMonth(monthKey, 1))} aria-label="เดือนถัดไป" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight size={16} /></button></div>} />
      <div className="px-5 pb-5 sm:px-6">
        <div className="mb-3 text-center text-sm font-bold text-slate-700">{monthTitle.format(month)}</div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekdays.map((day) => <div key={day} className="pb-2 text-[10px] font-semibold text-slate-400">{day}</div>)}
          {cells.map((day, index) => {
            const count = day ? activityDays[String(day)] ?? 0 : 0;
            const today = day === Number(todayValues.day) && monthNumber === Number(todayValues.month) && year === Number(todayValues.year);
            return <div key={`${day ?? "empty"}-${index}`} className="flex h-9 flex-col items-center justify-center">
              {day ? <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${today ? "bg-blue-900 font-bold text-white" : count ? "font-semibold text-blue-900" : "text-slate-600"}`}>{day}</span> : null}
              {count > 0 ? <span aria-label={`${count} กิจกรรม`} className={`mt-0.5 h-1 w-1 rounded-full ${count > 1 ? "bg-orange-500" : "bg-emerald-500"}`} /> : <span className="mt-0.5 h-1 w-1" />}
            </div>;
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />มีกิจกรรม</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-orange-500" />หลายกิจกรรม</span></div>
      </div>
    </Card>
  );
}

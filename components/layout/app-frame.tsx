"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart3, Bell, CalendarDays, ChevronDown, ClipboardCheck,
  FileBarChart2, GraduationCap, LayoutDashboard, LogIn, Menu, Settings2,
  ShieldCheck, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/ui-store";

const navItems = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/activities", label: "จัดการกิจกรรม", icon: CalendarDays },
  { href: "/evaluations/cipp", label: "ประเมินโครงการ CIPP", icon: ClipboardCheck },
  { href: "/reports", label: "รายงานผลการดำเนินงาน", icon: FileBarChart2 },
  { href: "/satisfaction", label: "แบบประเมินความพึงพอใจ", icon: Activity },
  { href: "/satisfaction/manage", label: "จัดการแบบประเมิน", icon: Settings2 },
  { href: "/satisfaction/results", label: "สรุปความพึงพอใจ", icon: BarChart3 },
  { href: "/users", label: "ผู้ใช้งานและสิทธิ์", icon: Users },
];

function Sidebar({ close, termLabel, academicYear }: { close?: () => void; termLabel: string; academicYear: number }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-white">
      <Link href="/" onClick={close} className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/15"><GraduationCap size={23} strokeWidth={2.2} /></span>
        <span className="min-w-0"><span className="block truncate text-sm font-extrabold text-slate-900">น้ำคำวิทยา</span><span className="mt-0.5 block text-[11px] text-slate-500">ระบบประเมินโครงการ</span></span>
      </Link>
      <div className="px-3 pt-5">
        <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-400">เมนูหลัก</p>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} onClick={close} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition", active ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                <Icon size={17} className={active ? "text-blue-800" : "text-slate-400 group-hover:text-slate-600"} />
                <span className="flex-1">{label}</span>
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-blue-700" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto px-4 pb-4 pt-8">
        <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold"><ShieldCheck size={15} /> ภาคเรียน {termLabel}</div>
          <p className="mt-2 text-[11px] leading-5 text-blue-100">ติดตามผลกิจกรรมและการประเมินในที่เดียว</p>
          <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-[10px] text-blue-100"><span>ปีการศึกษา</span><span className="font-bold text-white">{academicYear}</span></div>
        </div>
        <p className="mt-4 px-2 text-[10px] text-slate-400">โรงเรียนน้ำคำวิทยา · ศรีสะเกษ</p>
      </div>
    </div>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { data: dashboard } = useQuery<{ metrics: { academicYear: number; termLabel: string } }>({
    queryKey: ["dashboard"],
    enabled: pathname !== "/login",
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดปีการศึกษาไม่สำเร็จ");
      return response.json();
    },
  });
  const academicYear = dashboard?.metrics.academicYear ?? 2569;
  const termLabel = dashboard?.metrics.termLabel ?? "—";
  const mobileOpen = useUiStore((state) => state.mobileMenuOpen);
  const setMobileOpen = useUiStore((state) => state.setMobileMenuOpen);
  const toggleMobileMenu = useUiStore((state) => state.toggleMobileMenu);
  if (pathname === "/login") return <>{children}</>;

  const initial = session?.user?.name?.trim()?.slice(0, 1) || "ค";
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] border-r border-slate-200/80 bg-white lg:block"><Sidebar termLabel={termLabel} academicYear={academicYear} /></aside>
      {mobileOpen ? <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="ปิดเมนู" className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} /><div className="absolute inset-y-0 left-0 w-[290px] shadow-2xl"><button onClick={() => setMobileOpen(false)} aria-label="ปิด" className="absolute right-3 top-3 z-10 rounded-lg bg-white p-2 text-slate-500"><X size={18} /></button><Sidebar close={() => setMobileOpen(false)} termLabel={termLabel} academicYear={academicYear} /></div></div> : null}
      <div className="lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7">
          <div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" onClick={toggleMobileMenu} aria-label="เปิดเมนู"><Menu size={18} /></button><div><p className="text-xs font-semibold text-slate-500">โรงเรียนน้ำคำวิทยา</p><p className="hidden text-[11px] text-slate-400 sm:block">ระบบประเมินและบริหารจัดการโครงการ/กิจกรรมสถานศึกษา</p></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 sm:inline-flex">ปีการศึกษา {academicYear}</span><button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="การแจ้งเตือน"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-orange-500" /></button>
            {session?.user ? <div className="group relative"><button className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{initial}</span><span className="hidden max-w-32 text-left sm:block"><span className="block truncate text-xs font-bold text-slate-800">{session.user.name || "ผู้ใช้งาน"}</span><span className="block text-[10px] text-slate-500">{session.user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ครู"}</span></span><ChevronDown size={14} className="text-slate-400" /></button><div className="invisible absolute right-0 top-full z-40 mt-2 w-44 rounded-xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><Link href="/users" className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">บัญชีและสิทธิ์</Link><form action="/api/auth/logout" method="post"><button className="w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50">ออกจากระบบ</button></form></div></div> : <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-blue-800"><LogIn size={15} /><span className="hidden sm:inline">เข้าสู่ระบบ</span></Link>}
            {status === "loading" ? <span className="hidden text-xs text-slate-400">กำลังตรวจสอบ...</span> : null}
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-132px)] w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white px-4 py-4 text-center text-[11px] text-slate-500 sm:px-7">พัฒนาโดย <span className="font-semibold text-slate-700">นายธวัชชัย แก่นจักร์</span> <span className="mx-1 text-slate-300">·</span> โรงเรียนน้ำคำวิทยา จังหวัดศรีสะเกษ</footer>
      </div>
    </div>
  );
}

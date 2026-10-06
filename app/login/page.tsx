"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Suspense } from "react";
import { ArrowLeft, GraduationCap, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/primitives";

const errors: Record<string, string> = {
  oauth_not_configured: "ยังไม่ได้ตั้งค่าการเชื่อมต่อบัญชี Manus สำหรับระบบนี้",
  oauth_state_invalid: "คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่",
  oauth_exchange_failed: "ไม่สามารถแลกเปลี่ยนรหัสเข้าสู่ระบบได้ กรุณาลองใหม่",
  oauth_profile_failed: "ไม่สามารถตรวจสอบข้อมูลบัญชีได้",
  oauth_callback_failed: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่",
};

function LoginContent() {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const error = search.get("error");
  useEffect(() => {
    if (session?.user) router.replace("/");
  }, [router, session]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8efff,_#f5f7fb_55%)] px-4 py-10">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-900"><ArrowLeft size={14} /> กลับไปหน้าแดชบอร์ดตัวอย่าง</Link>
        <Card className="overflow-hidden border-white/70 shadow-[0_24px_80px_rgba(30,58,138,.12)]">
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 px-7 pb-8 pt-7 text-white">
            <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><GraduationCap size={26} /></span><span><span className="block text-sm font-extrabold">โรงเรียนน้ำคำวิทยา</span><span className="mt-1 block text-xs text-blue-100">จังหวัดศรีสะเกษ</span></span></div>
            <h1 className="mt-8 text-2xl font-extrabold">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-sm leading-6 text-blue-100">จัดการกิจกรรมและติดตามผลการประเมินในพื้นที่ทำงานเดียว</p>
          </div>
          <div className="px-7 py-7">
            {error ? <div role="alert" className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors[error] ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่"}</div> : null}
            {search.get("signedOut") ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">ออกจากระบบแล้ว</div> : null}
            <Link href="/api/auth/manus/start" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"><ShieldCheck size={17} /> เข้าสู่ระบบด้วยบัญชี Manus</Link>
            <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">ระบบจะตรวจสอบตัวตนผ่านบัญชี Manus และกำหนดสิทธิ์ตามบทบาทที่ได้รับ</p>
            <div className="my-6 flex items-center gap-3 text-[10px] text-slate-400"><span className="h-px flex-1 bg-slate-100" />หรือ<span className="h-px flex-1 bg-slate-100" /></div>
            <Link href="/" className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">ดูข้อมูลตัวอย่างแบบอ่านอย่างเดียว</Link>
            <p className="mt-5 text-center text-[10px] text-slate-400">{status === "loading" ? "กำลังตรวจสอบสถานะบัญชี…" : "เฉพาะผู้ใช้ที่ได้รับสิทธิ์เท่านั้นจึงแก้ไขข้อมูลได้"}</p>
          </div>
        </Card>
        <footer className="mt-5 text-center text-[11px] leading-5 text-slate-500">พัฒนาโดย นายธวัชชัย แก่นจักร์ · โรงเรียนน้ำคำวิทยา จังหวัดศรีสะเกษ</footer>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4"><div className="rounded-2xl bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">กำลังโหลดหน้าเข้าสู่ระบบ…</div></main>}><LoginContent /></Suspense>;
}

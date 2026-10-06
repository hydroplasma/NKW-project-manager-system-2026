import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { AppFrame } from "@/components/layout/app-frame";

export const metadata: Metadata = {
  title: "ระบบประเมินและบริหารจัดการโครงการ | โรงเรียนน้ำคำวิทยา",
  description: "ระบบติดตาม ประเมินผล และบริหารจัดการโครงการ/กิจกรรมสถานศึกษา โรงเรียนน้ำคำวิทยา จังหวัดศรีสะเกษ",
  icons: { icon: "/school-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}

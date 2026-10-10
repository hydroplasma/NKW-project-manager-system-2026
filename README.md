# ระบบประเมินและบริหารจัดการโครงการ/กิจกรรมสถานศึกษา

เว็บแอปภาษาไทยสำหรับโรงเรียนน้ำคำวิทยา จังหวัดศรีสะเกษ รองรับ Dashboard, การจัดการกิจกรรม, แบบประเมิน CIPP, รายงานผลโครงการ, ความพึงพอใจ และสิทธิ์ผู้ใช้ ครู/ผู้ดูแลระบบ

- ปีการศึกษาตัวอย่าง: **2569** · ภาคเรียน: **2/2569**
- ผู้พัฒนา: **นายธวัชชัย แก่นจักร์** (แสดงใน Footer)
- ฐานข้อมูลเริ่มต้น: **SQLite** ตามตัวเลือกของผู้ใช้

## เทคโนโลยี

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui component patterns (CVA + Radix Slot), Prisma, SQLite, NextAuth.js กับ Manus OAuth, TanStack React Query, Zustand, Recharts และ Lucide Icons

## เตรียมเครื่อง

- Node.js 20+ (พัฒนา/ทดสอบด้วย Node 22)
- pnpm 11+

```bash
pnpm install
cp .env.example .env.local
```

เปิด `.env.local` และกำหนดค่าเหล่านี้ก่อนเข้าสู่ระบบ:

- `SQLITE_DATABASE_URL="file:../dev.db"` สำหรับฐานข้อมูล SQLite ภายในเครื่อง
- `NEXTAUTH_URL` ต้องเป็น public origin ที่ผู้ใช้เปิดเว็บจริง เช่น `http://localhost:3000` ในเครื่อง หรือ URL HTTPS ของ Preview/โดเมนที่เผยแพร่ ห้ามใช้ Host ภายในของ Preview เป็น callback URL
- `NEXTAUTH_SECRET` ใช้เฉพาะการพัฒนาในเครื่อง; ห้าม commit ค่า secret จริง
- `MANUS_PROJECT_ID`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_OAUTH_API_URL` และ `MANUS_JWT_SECRET` ปกติ WebDev จะ inject ใน runtime ให้ ไม่ต้องบันทึกลง Git
- `INITIAL_ADMIN_OPEN_ID` เป็น OpenID ของบัญชี Manus ที่ได้รับแต่งตั้งผู้ดูแลระบบ ระบบไม่ยกระดับบัญชีโดยอัตโนมัติ หากเว้นว่าง ผู้ใช้ใหม่จะเป็นครู

ระบบใช้ Manus OAuth; ผู้ใช้จะเห็นสถานะยังไม่เข้าสู่ระบบจนกว่าจะผ่าน callback จริง การรับรอง session ตรวจ JWT แบบ HS256, appId, อายุ token และค้นหาบัญชี/บทบาทในฐานข้อมูล

## สร้างฐานข้อมูลและข้อมูลตัวอย่าง

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

คำสั่ง `db:seed` ทำซ้ำได้และสร้างปี/ภาคเรียน, คำถาม CIPP และความพึงพอใจ, กิจกรรมตัวอย่าง และรายงานตัวอย่าง รายการ seed สำหรับดูตัวอย่างไม่ใช่บัญชีจริงและไม่สามารถใช้เข้าสู่ระบบได้

## เริ่มระบบ

```bash
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000) เมื่อตั้ง `NEXTAUTH_URL` ให้ตรงกับ origin นี้ หน้าเว็บมี route manifest ที่ `/manus-routes.json`

คำสั่งที่ใช้ได้:

```bash
pnpm typecheck   # ตรวจ TypeScript
pnpm lint        # ตรวจ ESLint
pnpm build       # สร้าง production build
pnpm start       # เริ่ม production server
pnpm db:studio   # เปิด Prisma Studio
```

## บทบาทและข้อมูล

- ครู: ดูข้อมูลสาธารณะ ส่งแบบประเมิน และแก้กิจกรรม/รายงานที่ตนสร้างตามสิทธิ์
- ผู้ดูแลระบบ: จัดการคำถามแบบประเมินและกำหนดบทบาทผู้ใช้ พร้อมบันทึกผลอนุมัติรายงาน
- กิจกรรมภายในจำกัดการเข้าถึงและตอบแบบประเมินตาม session
- แบบประเมินเก็บคะแนนจำนวนเต็ม 1–5 พร้อมค่าเฉลี่ย, sample S.D. และระดับความพึงพอใจ
- ภาพกิจกรรมให้ระบุ HTTPS URL หรือ path ของ Manus Storage; ไม่แนะนำ URL จากโดเมนที่ไม่เชื่อถือ

## ข้อจำกัด SQLite และการใช้งานบนโฮสต์

SQLite ที่จัดเก็บเป็นไฟล์เหมาะกับการติดตั้ง/ทดลองบนเครื่องเดียว ข้อมูลในระบบไฟล์ของ container หรือ instance ที่ถูกแทนที่อาจไม่คงทน และไม่เหมาะกับการเขียนพร้อมกันจากหลาย instance โปรเจกต์นี้ตั้ง Prisma provider เป็น SQLite ตามคำยืนยันของผู้ใช้ และ **ยังไม่ควรนำขึ้น production ที่ต้องคงข้อมูลถาวร** จนกว่าจะย้าย schema/migrations ไปฐานข้อมูลที่โฮสต์รองรับ เช่น MySQL ที่เตรียมไว้ใน WebDev และทดสอบการย้ายข้อมูล/สำรองข้อมูลก่อน

### WebDev container deployment

- `Dockerfile` ใช้ pnpm 11.25.0 และ lockfile ของโปรเจกต์, เตรียม schema/ข้อมูลตัวอย่างสำหรับ demo build, และรัน Next.js production server โดยฟัง `0.0.0.0` บน `PORT` (ค่าเริ่มต้น 3000)
- Health check ใช้ `GET /api/health` ซึ่งไม่ต้องล็อกอินและไม่เชื่อมฐานข้อมูล
- SQLite ใน published container เป็นข้อมูลตัวอย่างสำหรับ demo เท่านั้น; container filesystem เป็นแบบชั่วคราวและไม่ซิงก์กับ SQLite ใน Preview/เครื่องพัฒนา ห้ามบันทึกข้อมูลโครงการจริงจนกว่าจะย้ายไปฐานข้อมูลแบบ durable
- OAuth ใน production ต้องมี `NEXTAUTH_URL` ตรงกับ HTTPS origin ที่เผยแพร่จริง; runtime environment ที่ตรวจพบยังไม่มีค่านี้

## โครงสร้างหลัก

- `app/` — หน้าภาษาไทยและ Next.js Route Handlers สำหรับ API
- `components/` — App shell, Dashboard, กิจกรรม, กราฟ และ UI primitives
- `lib/auth/` — Manus OAuth session, JWT, identity และ role guards
- `lib/evaluation.ts` — สูตรคำนวณผล CIPP/ความพึงพอใจ
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` — data model, migration และข้อมูลตัวอย่าง
- `public/manus-routes.json` — manifest เส้นทางหน้าเว็บ
- `TODO.md` — เกณฑ์ส่งมอบตามคำขอ

## ความปลอดภัย

อย่า commit `.env.local`, `dev.db`, token, secret หรือข้อมูลส่วนบุคคลจริง ไฟล์เหล่านี้ถูกกันไว้ใน `.gitignore` หากต้องใช้ข้อมูลจริงให้สำรองและกำหนดนโยบายสิทธิ์/การเก็บรักษาก่อนเริ่มใช้งาน


### Origin protection สำหรับ write requests

API ที่เปลี่ยนข้อมูลจะตรวจ `Origin` (หรือ `Referer` เมื่อเบราว์เซอร์ไม่ส่ง Origin) เทียบ origin แบบตรงตัวกับ `NEXTAUTH_URL` ก่อนดำเนินการ โปรดตั้ง `NEXTAUTH_URL` ให้ตรงกับ public URL ที่ใช้งานจริงทั้ง Preview และ production; origin ที่ไม่ตรงหรือไม่ระบุจะถูกปฏิเสธ

วันที่และเวลาในแบบฟอร์มกิจกรรม, ปฏิทิน และรายงานใช้เขตเวลาโรงเรียน `Asia/Bangkok` (UTC+7) อย่างชัดเจน เพื่อไม่ให้วันที่คลาดเคลื่อนตาม timezone ของ server หรืออุปกรณ์ผู้ใช้

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dimensions = [
  { key: "CONTEXT", label: "ด้านบริบท (Context Evaluation : C)" },
  { key: "INPUT", label: "ด้านปัจจัยนำเข้า (Input Evaluation : I)" },
  { key: "PROCESS", label: "ด้านกระบวนการ (Process Evaluation : P)" },
  { key: "PRODUCT", label: "ด้านผลผลิต (Product Evaluation : P)" },
] as const;

type DimensionKey = (typeof dimensions)[number]["key"];
const questionGroups: Record<DimensionKey, string[]> = {
  CONTEXT: [
    "โครงการสอดคล้องกับนโยบายและเป้าหมายของสถานศึกษา",
    "โครงการตอบสนองความต้องการของผู้เรียนและชุมชน",
    "วัตถุประสงค์ของโครงการมีความชัดเจนและเหมาะสม",
  ],
  INPUT: [
    "บุคลากรที่รับผิดชอบมีความรู้และความพร้อม",
    "วัสดุ อุปกรณ์ และสถานที่มีความเหมาะสม",
    "งบประมาณและทรัพยากรเพียงพอต่อการดำเนินงาน",
  ],
  PROCESS: [
    "การวางแผนและการสื่อสารก่อนจัดกิจกรรมมีความชัดเจน",
    "การดำเนินกิจกรรมเป็นไปตามแผนและระยะเวลาที่กำหนด",
    "มีการติดตามและแก้ไขปัญหาระหว่างดำเนินงานอย่างเหมาะสม",
  ],
  PRODUCT: [
    "ผู้เข้าร่วมบรรลุผลตามวัตถุประสงค์ของโครงการ",
    "กิจกรรมสร้างประโยชน์ต่อผู้เรียนและสถานศึกษา",
    "ผลที่เกิดขึ้นสามารถนำไปต่อยอดได้อย่างเหมาะสม",
  ],
};

const satisfactionQuestions = [
  "ความเหมาะสมของสถานที่จัดกิจกรรม",
  "ความพร้อมและเพียงพอของอุปกรณ์",
  "ความเหมาะสมของระยะเวลาในการจัดกิจกรรม",
  "ความรู้และประสบการณ์ที่ได้รับจากกิจกรรม",
  "ความสามารถในการนำความรู้ไปประยุกต์ใช้",
  "โอกาสในการซักถามและแลกเปลี่ยนความคิดเห็น",
];

const activities = [
  { code: "NK-6901", title: "สัปดาห์วิทยาศาสตร์และนวัตกรรม", ownerName: "กลุ่มสาระการเรียนรู้วิทยาศาสตร์", date: "2026-10-08T02:00:00.000Z", location: "อาคารเรียน 1", participants: 180, visibility: "PUBLIC", status: "OPEN" },
  { code: "NK-6902", title: "โครงการส่งเสริมการอ่านสู่ชุมชน", ownerName: "นางสาวศิริพร ใจดี", date: "2026-10-15T02:00:00.000Z", location: "ห้องสมุดโรงเรียน", participants: 95, visibility: "PUBLIC", status: "OPEN" },
  { code: "NK-6903", title: "อบรมทักษะดิจิทัลสำหรับครู", ownerName: "งานพัฒนาบุคลากร", date: "2026-09-24T02:00:00.000Z", location: "ห้องประชุมศรีสะเกษ", participants: 42, visibility: "INTERNAL", status: "COMPLETED" },
  { code: "NK-6904", title: "กิจกรรมจิตอาสาพัฒนาสิ่งแวดล้อม", ownerName: "สภานักเรียน", date: "2026-10-22T02:00:00.000Z", location: "บริเวณโรงเรียน", participants: 120, visibility: "PUBLIC", status: "OPEN" },
  { code: "NK-6905", title: "ประชุมวางแผนยกระดับผลสัมฤทธิ์", ownerName: "ฝ่ายวิชาการ", date: "2026-09-18T02:00:00.000Z", location: "ห้องประชุมเล็ก", participants: 28, visibility: "INTERNAL", status: "COMPLETED" },
  { code: "NK-6906", title: "ค่ายส่งเสริมทักษะอาชีพ", ownerName: "งานแนะแนว", date: "2026-11-05T02:00:00.000Z", location: "โรงฝึกงาน", participants: 75, visibility: "PUBLIC", status: "OPEN" },
];

async function main() {
  const year = await prisma.academicYear.upsert({
    where: { year: 2569 },
    update: { isCurrent: true },
    create: { year: 2569, isCurrent: true },
  });
  const semester1 = await prisma.semester.upsert({
    where: { academicYearId_termNumber: { academicYearId: year.id, termNumber: 1 } },
    update: { label: "1/2569", startsAt: new Date("2026-05-15T17:00:00Z"), endsAt: new Date("2026-09-30T16:59:59Z") },
    create: { academicYearId: year.id, termNumber: 1, label: "1/2569", startsAt: new Date("2026-05-15T17:00:00Z"), endsAt: new Date("2026-09-30T16:59:59Z") },
  });
  const semester2 = await prisma.semester.upsert({
    where: { academicYearId_termNumber: { academicYearId: year.id, termNumber: 2 } },
    update: { label: "2/2569", startsAt: new Date("2026-09-30T17:00:00Z"), endsAt: new Date("2027-03-31T16:59:59Z") },
    create: { academicYearId: year.id, termNumber: 2, label: "2/2569", startsAt: new Date("2026-09-30T17:00:00Z"), endsAt: new Date("2027-03-31T16:59:59Z") },
  });

  const records = [];
  for (const entry of activities) {
    const startsAt = new Date(entry.date);
    const semester = startsAt < semester2.startsAt ? semester1 : semester2;
    const activity = await prisma.activity.upsert({
      where: { code: entry.code },
      update: {
        title: entry.title, ownerName: entry.ownerName, startsAt,
        location: entry.location, participantCount: entry.participants,
        visibility: entry.visibility, status: entry.status,
        academicYearId: year.id, semesterId: semester.id,
      },
      create: {
        code: entry.code, title: entry.title,
        description: "ข้อมูลตัวอย่างสำหรับสาธิตระบบประเมินและบริหารจัดการโครงการ/กิจกรรมสถานศึกษา",
        ownerName: entry.ownerName, startsAt,
        endsAt: new Date(startsAt.getTime() + 5 * 60 * 60 * 1000),
        location: entry.location, participantCount: entry.participants,
        visibility: entry.visibility, status: entry.status,
        academicYearId: year.id, semesterId: semester.id,
      },
    });
    records.push(activity);
  }

  const cippQuestionIds: Record<DimensionKey, string[]> = {
    CONTEXT: [], INPUT: [], PROCESS: [], PRODUCT: [],
  };
  for (const dimension of dimensions) {
    for (const [index, question] of questionGroups[dimension.key].entries()) {
      const id = `seed-${dimension.key.toLowerCase()}-${index + 1}`;
      await prisma.cippQuestion.upsert({
        where: { id },
        update: { dimension: dimension.key, question, sortOrder: index + 1, isActive: true },
        create: { id, dimension: dimension.key, question, sortOrder: index + 1 },
      });
      cippQuestionIds[dimension.key].push(id);
    }
  }

  const satisfactionQuestionIds: string[] = [];
  for (const [index, question] of satisfactionQuestions.entries()) {
    const id = `seed-satisfaction-question-${index + 1}`;
    await prisma.satisfactionQuestion.upsert({
      where: { id },
      update: { question, sortOrder: index + 1, isActive: true },
      create: { id, question, sortOrder: index + 1 },
    });
    satisfactionQuestionIds.push(id);
  }

  const cippBaseScores = [4.2, 4.4, 4.1, 4.6];
  for (const [activityIndex, activity] of records.entries()) {
    for (let respondent = 0; respondent < 3; respondent += 1) {
      const evaluationId = `seed-cipp-${activity.code}-${respondent + 1}`;
      const submittedAt = new Date(activity.startsAt.getTime() + (respondent + 1) * 3600000);
      await prisma.cippEvaluation.upsert({
        where: { id: evaluationId },
        update: { respondentName: `ผู้ประเมินตัวอย่าง ${respondent + 1}`, submittedAt },
        create: { id: evaluationId, activityId: activity.id, respondentName: `ผู้ประเมินตัวอย่าง ${respondent + 1}`, submittedAt },
      });
      for (const [dimensionIndex, dimension] of dimensions.entries()) {
        for (const [questionIndex, questionId] of cippQuestionIds[dimension.key].entries()) {
          const offset = ((respondent + questionIndex + activityIndex) % 3 - 1) * 0.35;
          const score = Math.max(1, Math.min(5, Math.round(cippBaseScores[dimensionIndex] + offset)));
          await prisma.cippAnswer.upsert({
            where: { evaluationId_questionId: { evaluationId, questionId } },
            update: { score },
            create: { evaluationId, questionId, score },
          });
        }
      }

      const responseId = `seed-satisfaction-${activity.code}-${respondent + 1}`;
      const suggestion = respondent === 0 ? "ควรเพิ่มช่วงแลกเปลี่ยนความคิดเห็น" : "กิจกรรมเป็นประโยชน์และจัดได้เหมาะสม";
      await prisma.satisfactionResponse.upsert({
        where: { id: responseId },
        update: { respondentName: `ผู้ตอบตัวอย่าง ${respondent + 1}`, suggestion, submittedAt },
        create: { id: responseId, activityId: activity.id, respondentName: `ผู้ตอบตัวอย่าง ${respondent + 1}`, suggestion, submittedAt },
      });
      for (const [questionIndex, questionId] of satisfactionQuestionIds.entries()) {
        const score = 4 + ((respondent + questionIndex + activityIndex) % 2);
        await prisma.satisfactionAnswer.upsert({
          where: { responseId_questionId: { responseId, questionId } },
          update: { score },
          create: { responseId, questionId, score },
        });
      }
    }

    if (activityIndex === 0 || activityIndex === 2 || activityIndex === 4) {
      const report = await prisma.activityReport.upsert({
        where: { activityId: activity.id },
        update: {
          participantCount: activity.participantCount, passRate: 92, satisfactionLevel: 4.55,
          budgetApproved: activityIndex === 2 ? 18000 : activityIndex === 4 ? 12000 : 15000,
          budgetSpent: activityIndex === 2 ? 16500 : activityIndex === 4 ? 10800 : 14200,
          strengths: "ผู้เข้าร่วมมีส่วนร่วมดี และทีมงานประสานงานได้เป็นระบบ",
          challenges: "ช่วงท้ายกิจกรรมมีเวลาสรุปผลค่อนข้างจำกัด",
          recommendations: "ควรเตรียมเอกสารและกำหนดเวลาสะท้อนผลให้ชัดเจน",
        },
        create: {
          activityId: activity.id, participantCount: activity.participantCount,
          passRate: 92, satisfactionLevel: 4.55,
          budgetApproved: activityIndex === 2 ? 18000 : activityIndex === 4 ? 12000 : 15000,
          budgetSpent: activityIndex === 2 ? 16500 : activityIndex === 4 ? 10800 : 14200,
          strengths: "ผู้เข้าร่วมมีส่วนร่วมดี และทีมงานประสานงานได้เป็นระบบ",
          challenges: "ช่วงท้ายกิจกรรมมีเวลาสรุปผลค่อนข้างจำกัด",
          recommendations: "ควรเตรียมเอกสารและกำหนดเวลาสะท้อนผลให้ชัดเจน",
        },
      });
      const roles = ["REPORTER", "VICE_PRINCIPAL", "PRINCIPAL"];
      const names = ["ครูผู้รายงานตัวอย่าง", "รองผู้อำนวยการ (ตัวอย่าง)", "ผู้อำนวยการ (ตัวอย่าง)"];
      for (const [roleIndex, role] of roles.entries()) {
        await prisma.approvalSignature.upsert({
          where: { reportId_role: { reportId: report.id, role } },
          update: {},
          create: { reportId: report.id, role, fullName: names[roleIndex], decision: "PENDING" },
        });
      }
    }
  }

  console.log(`Seed สำเร็จ: ${records.length} กิจกรรม, ${dimensions.length * 3} ข้อ CIPP, ${satisfactionQuestionIds.length} ข้อความพึงพอใจ`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

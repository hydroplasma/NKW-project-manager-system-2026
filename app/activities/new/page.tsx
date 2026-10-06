import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActivityForm } from "@/components/activities/activity-form";
import { Button, PageHeading } from "@/components/ui/primitives";

export default function NewActivityPage() {
  return <div><PageHeading eyebrow="โครงการและกิจกรรม" title="เพิ่มกิจกรรม" description="กรอกรายละเอียดเพื่อบันทึกโครงการหรือกิจกรรมใหม่" action={<Button asChild variant="secondary"><Link href="/activities"><ArrowLeft size={15} /> กลับรายการ</Link></Button>} /><ActivityForm /></div>;
}

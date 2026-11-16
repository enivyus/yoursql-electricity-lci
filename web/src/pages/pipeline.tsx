import { Breadcrumb, SectionHeading } from "@/components/blocks"
import { HistoryTable, QualityPanel } from "@/components/sources"
import { history, reviewedRows, snapshotFiles, totalRows } from "@/lib/data"

const steps = [
  { n: "01", title: "เก็บไฟล์ต้นทาง", note: `ดาวน์โหลดไฟล์จากผู้เผยแพร่ ${snapshotFiles.size} ไฟล์ที่ข้อมูลอ้างถึง และบันทึก SHA-256 ใน snapshots/SHA256SUMS.txt`, file: "snapshots/" },
  { n: "02", title: "ถอดค่าทีละเซลล์", note: `ถอดตารางเป็น CSV ทุกแถวมี source_id ตำแหน่งในต้นฉบับ และค่าตามที่ปรากฏ รวม ${totalRows} แถว`, file: "scripts/build_stats.py · build_data.py" },
  { n: "03", title: "นำเข้าและตรวจทั้งชุด", note: "ตรวจ hash, header, ชนิดข้อมูล, FK และหน่วย ถ้าพบข้อผิดพลาดจะปฏิเสธทั้งชุดและไม่สร้างฐานข้อมูล", file: "sql/02_load.py" },
  { n: "04", title: "ตรวจคุณภาพทีละแถว", note: `แถวที่ผ่านเปลี่ยนเป็น reviewed ${reviewedRows} แถว และบันทึกประวัติ ${history.length} รายการที่แก้หรือลบไม่ได้`, file: "scripts/qa_review.py" },
  { n: "05", title: "เปิดดูข้อมูล", note: "ส่งออกจาก db/lci.db แบบอ่านอย่างเดียวมาเป็นเว็บนี้ คลิกแถวใดก็ได้เพื่อย้อนถึงต้นฉบับ", file: "web/scripts/export_data.py" },
]

export function Pipeline() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: "ข้อมูลไฟฟ้า", to: "/" }, { label: "เส้นทางข้อมูล" }]} />
        <h1 className="text-3xl font-bold tracking-tight">ข้อมูลเดินทางมาอย่างไร</h1>
        <p className="text-muted-foreground max-w-3xl">จากไฟล์ของผู้เผยแพร่ ถึงตัวเลขบนหน้าเว็บ ทุกขั้นรันซ้ำได้จากสคริปต์ใน repository</p>
      </div>
      <ol className="grid gap-px overflow-hidden rounded-lg border bg-[var(--border)] md:grid-cols-5">
        {steps.map((s) => (
          <li key={s.n} className="bg-card flex flex-col gap-2 p-5">
            <span className="text-primary text-sm font-semibold tabular-nums">{s.n}</span>
            <span className="font-semibold">{s.title}</span>
            <span className="text-muted-foreground text-sm leading-relaxed">{s.note}</span>
            <code className="text-muted-foreground mt-auto pt-2 font-mono text-[11px]">{s.file}</code>
          </li>
        ))}
      </ol>
      <section className="space-y-4">
        <SectionHeading eyebrow="ผลการตรวจ" title="คุณภาพข้อมูล" />
        <QualityPanel />
      </section>
      <section className="space-y-4">
        <HistoryTable />
      </section>
    </div>
  )
}

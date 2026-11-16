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
        <h1 className="text-3xl font-bold tracking-tight">จากไฟล์ต้นทาง ถึงตัวเลขบนเว็บ</h1>
        <p className="text-muted-foreground max-w-3xl">จากไฟล์ของผู้เผยแพร่ ถึงตัวเลขบนหน้าเว็บ ทุกขั้นรันซ้ำได้จากสคริปต์ใน repository</p>
      </div>
      <ol className="relative space-y-4 pl-12">
        <span aria-hidden className="bg-border absolute top-2 bottom-2 left-[19px] w-0.5" />
        {steps.map((s) => (
          <li key={s.n} className="relative">
            <span className="bg-primary text-primary-foreground absolute top-4 -left-12 flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums ring-4 ring-[var(--background)]">
              {s.n}
            </span>
            <div className="bg-card grid gap-2 rounded-2xl border p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-muted-foreground mt-1 text-sm leading-relaxed">{s.note}</div>
              </div>
              <code className="bg-muted text-muted-foreground w-fit rounded-md px-2 py-1 font-mono text-[11px]">{s.file}</code>
            </div>
          </li>
        ))}
      </ol>
      <section className="space-y-4">
        <SectionHeading eyebrow="Quality" title="ผลการตรวจคุณภาพ" />
        <QualityPanel />
      </section>
      <section className="space-y-4">
        <HistoryTable />
      </section>
    </div>
  )
}

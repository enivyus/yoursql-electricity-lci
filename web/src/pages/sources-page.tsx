import { Breadcrumb } from "@/components/blocks"
import { SourcesTable } from "@/components/sources"

export function SourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: "ข้อมูลไฟฟ้า", to: "/" }, { label: "แหล่งข้อมูล" }]} />
        <h1 className="text-3xl font-bold tracking-tight">แหล่งข้อมูล</h1>
        <p className="text-muted-foreground max-w-3xl">
          ทุกแถวในฐานข้อมูลอ้างรหัสแหล่ง SRC-xx · แหล่งที่ยังไม่ยืนยันสิทธิการเผยแพร่ซ้ำใช้เพื่อการศึกษาเท่านั้น
        </p>
      </div>
      <SourcesTable />
    </div>
  )
}

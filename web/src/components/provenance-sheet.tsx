import * as React from "react"
import { ExternalLink, FileText, Fingerprint, MapPin, CalendarDays, Copy, Check } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { history, sourceById, type Provenance } from "@/lib/data"

export type TraceTarget = {
  kind: "exchange" | "observation"
  id: number
  title: string
  value: string
  unit: string
  fields: { label: string; value: React.ReactNode }[]
  prov: Provenance
}

function Row({ icon: Icon, label, children }: { icon: typeof FileText; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1.25rem_1fr] gap-x-2 gap-y-0.5">
      <Icon className="text-muted-foreground mt-0.5 size-4" />
      <div className="text-muted-foreground text-xs">{label}</div>
      <div />
      <div className="text-sm break-words">{children}</div>
    </div>
  )
}

export function ProvenanceSheet({ target, onOpenChange }: { target: TraceTarget | null; onOpenChange: (o: boolean) => void }) {
  const [copied, setCopied] = React.useState(false)
  if (!target) return <Sheet open={false} onOpenChange={onOpenChange} />
  const src = sourceById[target.prov.source_id]
  const events = history.filter((h) => (target.kind === "exchange" ? h.exchange_id === target.id : h.obs_id === target.id))
  const copy = () => {
    navigator.clipboard?.writeText(target.prov.snapshot_sha256).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {target.kind === "exchange" ? "exchange_id" : "obs_id"} {target.id}
            </Badge>
            <StatusBadge status={target.prov.review_status} />
          </div>
          <SheetTitle className="text-lg">{target.title}</SheetTitle>
          <SheetDescription>ตามรอยแถวนี้กลับไปถึงไฟล์ต้นฉบับ</SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="text-muted-foreground text-xs">ค่าตามต้นฉบับ (value_original)</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {target.value || <span className="text-muted-foreground text-base">ว่าง (blank)</span>}
              <span className="text-muted-foreground ml-2 text-sm font-normal">{target.unit}</span>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {target.fields.map((f) => (
              <div key={f.label}>
                <dt className="text-muted-foreground text-xs">{f.label}</dt>
                <dd>{f.value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Separator />

        <div className="grid gap-4 px-4">
          <h3 className="text-sm font-semibold">ที่มา</h3>
          <Row icon={FileText} label={`แหล่ง ${src?.source_id ?? ""} · ${src?.publisher ?? ""}`}>
            {src?.title}
            {src?.url && (
              <a href={src.url} target="_blank" rel="noreferrer" className="text-primary ml-1 inline-flex items-center gap-0.5 underline-offset-4 hover:underline">
                เปิดลิงก์ <ExternalLink className="size-3" />
              </a>
            )}
          </Row>
          <Row icon={MapPin} label="ตำแหน่งในต้นฉบับ">
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{target.prov.location_in_source}</code>
          </Row>
          <Row icon={FileText} label="ไฟล์ snapshot">
            <span className="font-mono text-xs break-all">{target.prov.snapshot_file}</span>
          </Row>
          <Row icon={Fingerprint} label="SHA-256">
            <div className="flex items-start gap-2">
              <code className="font-mono text-xs leading-relaxed break-all">{target.prov.snapshot_sha256}</code>
              <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={copy} aria-label="คัดลอก hash">
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </Row>
          <Row icon={CalendarDays} label="ดาวน์โหลดเมื่อ">
            {target.prov.retrieved_on}
          </Row>
        </div>

        <Separator />

        <div className="grid gap-3 px-4 pb-6">
          <h3 className="text-sm font-semibold">ประวัติสถานะ ({events.length})</h3>
          {events.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีการเปลี่ยนสถานะ</p>}
          {events.map((h) => (
            <div key={h.history_id} className="relative border-l-2 pl-4">
              <span className="bg-background absolute top-1 -left-[5px] size-2 rounded-full border-2" style={{ borderColor: "var(--status-good)" }} />
              <div className="text-sm">
                <span className="text-muted-foreground">{h.old_status}</span> → <span className="font-medium">{h.new_status}</span>
              </div>
              <div className="text-muted-foreground text-xs">
                {h.changed_at} · {h.changed_by}
              </div>
              <div className="mt-1 text-sm">{h.reason}</div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

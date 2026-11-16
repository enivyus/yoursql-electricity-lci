import * as React from "react"
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Info, ScanSearch } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { TraceTarget } from "@/components/provenance-sheet"
import { exchanges, process, qa, sourceById, type Exchange } from "@/lib/data"

const compartmentTH: Record<string, string> = {
  air: "อากาศ", water: "น้ำ", soil: "ดิน", resource: "ทรัพยากร", technosphere: "เทคโนสเฟียร์",
}

export function exchangeTarget(e: Exchange): TraceTarget {
  return {
    kind: "exchange",
    id: e.exchange_id,
    title: e.flow,
    value: e.amount_original,
    unit: e.unit_original,
    prov: e,
    fields: [
      { label: "ทิศทาง", value: e.direction === "IN" ? "ขาเข้า (IN)" : "ขาออก (OUT)" },
      { label: "ชนิด flow", value: e.flow_type },
      { label: "ส่วนของสิ่งแวดล้อม", value: e.compartment ? compartmentTH[e.compartment] : "—" },
      { label: "ค่าตัวเลข (amount)", value: e.amount?.toLocaleString("en-US") ?? "NULL" },
      { label: "Allocation stage", value: e.allocation_stage },
      { label: "เอกสารที่อ้างถึง", value: e.cited_document ?? "—" },
      ...(e.remark ? [{ label: "หมายเหตุ", value: e.remark }] : []),
    ],
  }
}

function Highlight({ label, flow, sub }: { label: string; flow: string; sub: string }) {
  const e = exchanges.find((x) => x.flow === flow)!
  return (
    <Card className="gap-2 py-5">
      <CardHeader className="px-5">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl tabular-nums">
          {e.amount_original}
          <span className="text-muted-foreground ml-1.5 font-sans text-sm font-normal">{e.unit_original}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground px-5 text-xs">{sub}</CardContent>
    </Card>
  )
}

export function Lci({ onTrace }: { onTrace: (t: TraceTarget) => void }) {
  const [dir, setDir] = React.useState<"all" | "IN" | "OUT">("all")
  const src = sourceById[process.source_id]
  const rows = exchanges.filter((e) => dir === "all" || e.direction === dir)
  const facts: [string, string | null][] = [
    ["หน่วยการทำงาน (Functional unit)", process.functional_unit],
    ["ฐานอ้างอิงของกระบวนการ", process.reference_basis],
    ["ขอบเขตระบบ", process.system_boundary],
    ["วิธีปันส่วน (Allocation)", process.allocation_method],
    ["ระดับการรายงาน", process.reporting_level],
    ["พื้นที่", process.location_name],
  ]
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{process.domain}</Badge>
              <Badge variant="outline">{process.source_id}</Badge>
              <Badge variant="outline">{src.license_note}</Badge>
            </div>
            <CardTitle className="mt-2 text-lg leading-snug">{process.name}</CardTitle>
            <CardDescription>
              {src.title}{" "}
              <a href={src.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5 underline-offset-4 hover:underline">
                DOI <ExternalLink className="size-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="text-sm">{v ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Highlight label="ไฟฟ้า (Reference flow)" flow="Electricity" sub="ผลผลิตไฟฟ้ารวมต่อปี" />
          <Highlight label="ไอน้ำ (ผลผลิตร่วม)" flow="Steam" sub="ปันส่วนด้วยวิธีประสิทธิภาพ" />
          <Highlight label="CO₂ สู่อากาศ" flow="CO2" sub="อ้างจากรายงาน EIA (2555)" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>บัญชีรายการ LCI ({exchanges.length} รายการ)</CardTitle>
          <CardDescription>
            ตรวจแล้ว {qa.exchanges.reviewed ?? 0} · พักตรวจ {qa.exchanges.held_context ?? 0} · คลิกแถวเพื่อตามรอยถึงต้นฉบับ
          </CardDescription>
          <CardAction>
            <Tabs value={dir} onValueChange={(v) => setDir(v as typeof dir)}>
              <TabsList>
                <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                <TabsTrigger value="IN"><ArrowDownToLine />ขาเข้า</TabsTrigger>
                <TabsTrigger value="OUT"><ArrowUpFromLine />ขาออก</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 rounded-lg border p-3 text-sm">
            <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground">
              แถว <span className="text-foreground font-medium">พักตรวจ</span> คือค่าที่ยังใช้คำนวณไม่ได้ เช่น ตัวเลขรูปแบบผิดปกติ
              หรือรายงานเป็นความเข้มข้น (mg/l) แทนปริมาณรายปี ค่าเดิมยังเก็บไว้ครบเพื่อให้ตามรอยได้
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>ทิศทาง</TableHead>
                <TableHead>ส่วน</TableHead>
                <TableHead className="text-right">ค่าตามต้นฉบับ</TableHead>
                <TableHead>หน่วย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-10"><span className="sr-only">ตามรอย</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.exchange_id} className="cursor-pointer" onClick={() => onTrace(exchangeTarget(e))}>
                  <TableCell className="text-muted-foreground font-mono text-xs">{e.exchange_id}</TableCell>
                  <TableCell className="font-medium whitespace-normal">
                    {e.flow}
                    {e.is_reference === 1 && <Badge className="ml-2" variant="secondary">Reference</Badge>}
                    {e.remark && <div className="text-muted-foreground text-xs font-normal">{e.remark}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      {e.direction === "IN" ? <ArrowDownToLine className="size-3.5" /> : <ArrowUpFromLine className="size-3.5" />}
                      {e.direction}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{e.compartment ? compartmentTH[e.compartment] : "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{e.amount_original}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{e.unit_original}</TableCell>
                  <TableCell><StatusBadge status={e.review_status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7" aria-label={`ตามรอย ${e.flow}`}>
                      <ScanSearch />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

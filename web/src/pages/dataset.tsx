import * as React from "react"
import { ChevronLeft, ChevronRight, Download, ExternalLink, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Breadcrumb, Callout, SectionHeading, StatTiles, nf0 } from "@/components/blocks"
import { observationTarget } from "@/components/explorer"
import type { TraceTarget } from "@/components/provenance-sheet"
import {
  CapacityByProducer, GenerationByFuel, MonthlyGeneration, SingleLine, lfConfig, peakConfig,
} from "@/components/overview"
import {
  datasetStats, loadFactorYearly, measureLabel, monthTH, peakDemandYearly, sourceById,
  statusLabel, type Dataset, type Observation, type ReviewStatus,
} from "@/lib/data"

const PAGE = 20
const period = (o: Observation) => (o.month ? `${monthTH[o.month - 1]} ${o.year_ce}` : String(o.year_ce))

function toCsv(rows: Observation[]) {
  const cols: (keyof Observation)[] = [
    "obs_id", "source_id", "dataset_ref", "measure", "category", "frequency", "year_ce", "month",
    "value_original", "value", "unit_original", "location_in_source", "snapshot_sha256", "review_status",
  ]
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n")
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Charts({ id }: { id: Dataset["id"] }) {
  if (id === "generation")
    return (
      <div className="grid gap-4">
        <GenerationByFuel />
        <MonthlyGeneration />
      </div>
    )
  if (id === "capacity") return <CapacityByProducer />
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SingleLine title="ความต้องการไฟฟ้าสูงสุด (Peak demand)" desc="รายปี · MW" data={peakDemandYearly} config={peakConfig} unit="MW" source="ที่มา: SRC-01 สนพ. ตาราง 5.2-5" />
      <SingleLine title="ตัวประกอบการใช้ไฟฟ้า (Load factor)" desc="รายปี · %" data={loadFactorYearly} config={lfConfig} unit="%" domain={[50, 90]} source="ที่มา: SRC-01 สนพ. ตาราง 5.2-5" />
    </div>
  )
}

export function DatasetPage({ d, onTrace }: { d: Dataset; onTrace: (t: TraceTarget) => void }) {
  const s = datasetStats(d)
  const src = sourceById[d.sourceIds[0]]
  const measures = [...new Set(d.obs.map((o) => o.measure))]
  const categories = [...new Set(d.obs.map((o) => o.category))]
  const years = [...new Set(d.obs.map((o) => o.year_ce))].sort((a, b) => b - a)
  const hasMonthly = d.obs.some((o) => o.frequency === "monthly")

  const [q, setQ] = React.useState("")
  const [measure, setMeasure] = React.useState("all")
  const [category, setCategory] = React.useState("all")
  const [freq, setFreq] = React.useState("all")
  const [year, setYear] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [page, setPage] = React.useState(0)

  React.useEffect(() => {
    setQ(""); setMeasure("all"); setCategory("all"); setFreq("all"); setYear("all"); setStatus("all"); setPage(0)
  }, [d.id])

  const rows = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return d.obs.filter(
      (o) =>
        (measure === "all" || o.measure === measure) &&
        (category === "all" || o.category === category) &&
        (freq === "all" || o.frequency === freq) &&
        (year === "all" || String(o.year_ce) === year) &&
        (status === "all" || o.review_status === status) &&
        (!term || [o.obs_id, o.category, o.year_ce, o.location_in_source, o.value_original].join(" ").toLowerCase().includes(term)),
    )
  }, [d.obs, q, measure, category, freq, year, status])
  React.useEffect(() => setPage(0), [q, measure, category, freq, year, status])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice(page * PAGE, page * PAGE + PAGE)

  const download = () => {
    const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${d.id}_filtered.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: "ข้อมูลไฟฟ้า", to: "/" }, { label: d.title }]} />
        <div className="space-y-2">
          <div className="text-muted-foreground text-sm">{d.tag} · {d.tables}</div>
          <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
          <p className="text-muted-foreground max-w-3xl">
            {d.desc} · {src.publisher} ({src.source_id}){" "}
            <a href={src.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5 underline-offset-4 hover:underline">
              เปิดต้นทาง <ExternalLink className="size-3" />
            </a>
          </p>
        </div>
      </div>

      <StatTiles
        tiles={[
          { label: "ข้อมูลจากต้นฉบับ", value: nf0(s.rows), sub: `ค่าจาก ${d.tables}` },
          { label: "ตรวจแล้ว ย้อนต้นทางได้", value: nf0(s.reviewed), sub: "มีเซลล์ต้นฉบับ และ SHA-256", tone: "accept" },
          { label: "ค่าว่างในต้นฉบับ", value: nf0(s.blank), sub: "เก็บไว้เป็น blank ไม่นับ" },
          { label: "ช่วงข้อมูล", value: s.coverage.split(" · ")[0].replace("รายปี ", ""), sub: s.coverage },
        ]}
      />

      <Callout title="ทีมรับเป็นสถิติต้นทางแล้ว">
        ค่าที่ตรวจแล้วตรงกับไฟล์ของ {src.publisher} และย้อนถึงเซลล์ต้นฉบับได้ (ผลตรวจ M4 QA) · {d.notes.join(" ")}
      </Callout>

      <section className="space-y-4">
        <SectionHeading eyebrow="ภาพรวม" title="ดูแนวโน้ม" />
        <Charts id={d.id} />
      </section>

      <section className="space-y-4">
        <SectionHeading eyebrow="ค้นข้อมูล" title="ค้นข้อมูลที่ต้องการ" desc="คลิกแถวเพื่อดูเซลล์ต้นฉบับ ไฟล์ snapshot, SHA-256 และประวัติสถานะ" />
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6" style={{ background: "var(--paper)" }}>
          <Field label="ค้นหา">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ปี, เซลล์ เช่น B7" className="bg-background pl-8" />
            </div>
          </Field>
          {measures.length > 1 && (
            <Field label="ตัวชี้วัด">
              <Select value={measure} onValueChange={setMeasure}>
                <SelectTrigger className="bg-background w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกตัวชี้วัด</SelectItem>
                  {measures.map((m) => <SelectItem key={m} value={m}>{measureLabel[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          {categories.length > 1 && (
            <Field label="หมวด">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวด</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          {hasMonthly && (
            <Field label="ความถี่">
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger className="bg-background w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกความถี่</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="ปี ค.ศ.">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="bg-background w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกปี</SelectItem>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="สถานะ">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {(["reviewed", "unreviewed"] as ReviewStatus[]).map((st) => <SelectItem key={st} value={st}>{statusLabel[st]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">พบ {nf0(rows.length)} รายการ</p>
          <Button variant="outline" size="sm" onClick={download}>
            <Download />ส่งออก CSV ตามตัวกรอง
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader style={{ background: "var(--paper)" }}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">หมวด / ตัวชี้วัด</TableHead>
                <TableHead>ช่วงเวลา</TableHead>
                <TableHead className="text-right">ค่าต้นฉบับ</TableHead>
                <TableHead className="px-4">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.map((o) => (
                <TableRow key={o.obs_id} className="cursor-pointer" onClick={() => onTrace(observationTarget(o))}>
                  <TableCell className="px-4 py-3">
                    <div className="font-medium">{o.category}</div>
                    <div className="text-muted-foreground text-xs">{measureLabel[o.measure]} · obs {o.obs_id}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{period(o)}</TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="font-medium tabular-nums">
                      {o.value === null ? <span className="text-muted-foreground">ว่าง</span> : o.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-muted-foreground text-xs">{o.unit_original} · {o.location_in_source}</div>
                  </TableCell>
                  <TableCell className="px-4"><StatusBadge status={o.review_status} /></TableCell>
                </TableRow>
              ))}
              {view.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">ไม่พบข้อมูลตามตัวกรอง</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">หน้า {page + 1} / {pages}</span>
          <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="หน้าก่อน"><ChevronLeft /></Button>
          <Button variant="outline" size="icon" className="size-8" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="หน้าถัดไป"><ChevronRight /></Button>
        </div>
      </section>
    </div>
  )
}

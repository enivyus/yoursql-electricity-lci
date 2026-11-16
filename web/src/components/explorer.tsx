import * as React from "react"
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import type { TraceTarget } from "@/components/provenance-sheet"
import { measureLabel, monthTH, observations, statusLabel, type Measure, type Observation, type ReviewStatus } from "@/lib/data"

const PAGE = 15

const period = (o: Observation) => (o.month ? `${monthTH[o.month - 1]} ${o.year_ce}` : String(o.year_ce))

export function observationTarget(o: Observation): TraceTarget {
  return {
    kind: "observation",
    id: o.obs_id,
    title: `${measureLabel[o.measure]} · ${o.category}`,
    value: o.value_original,
    unit: o.unit_original,
    prov: o,
    fields: [
      { label: "ชุดข้อมูล", value: <span className="font-mono text-xs">{o.dataset_ref}</span> },
      { label: "ช่วงเวลา", value: `${period(o)} (${o.frequency === "yearly" ? "รายปี" : "รายเดือน"})` },
      { label: "ป้ายปีในต้นฉบับ", value: o.year_label },
      { label: "ประเภทปี", value: o.year_type },
      { label: "ชนิดหมวด", value: o.category_kind },
      { label: "ฐานการผลิต", value: o.generation_basis ?? "—" },
      { label: "ค่าเบื้องต้น (preliminary)", value: o.is_preliminary ? "ใช่" : "ไม่ใช่" },
      { label: "ค่าตัวเลข (value)", value: o.value?.toLocaleString("en-US", { maximumFractionDigits: 6 }) ?? "NULL (blank)" },
    ],
  }
}

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

const categories = [...new Set(observations.map((o) => o.category))].sort()

export function Explorer({ onTrace }: { onTrace: (t: TraceTarget) => void }) {
  const [q, setQ] = React.useState("")
  const [measure, setMeasure] = React.useState<"all" | Measure>("all")
  const [freq, setFreq] = React.useState<"all" | "yearly" | "monthly">("all")
  const [category, setCategory] = React.useState("all")
  const [status, setStatus] = React.useState<"all" | ReviewStatus>("all")
  const [page, setPage] = React.useState(0)

  const rows = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    return observations.filter(
      (o) =>
        (measure === "all" || o.measure === measure) &&
        (freq === "all" || o.frequency === freq) &&
        (category === "all" || o.category === category) &&
        (status === "all" || o.review_status === status) &&
        (!term ||
          [o.obs_id, o.dataset_ref, o.category, o.year_ce, o.location_in_source, o.value_original]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    )
  }, [q, measure, freq, category, status])

  React.useEffect(() => setPage(0), [q, measure, freq, category, status])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice(page * PAGE, page * PAGE + PAGE)
  const filtered = q || measure !== "all" || freq !== "all" || category !== "all" || status !== "all"

  const download = () => {
    const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "stat_observation_filtered.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สำรวจข้อมูลสถิติไฟฟ้า (stat_observation)</CardTitle>
        <CardDescription>ค่าทั้งหมด {observations.length} แถว · คลิกแถวเพื่อดูเซลล์ต้นฉบับ, SHA-256 และประวัติสถานะ</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={download}>
            <Download />
            CSV ({rows.length})
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา ปี, ชุดข้อมูล, เซลล์ เช่น B7" className="pl-8" />
          </div>
          <Select value={measure} onValueChange={(v) => setMeasure(v as typeof measure)}>
            <SelectTrigger className="w-[190px]" aria-label="ตัวชี้วัด"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกตัวชี้วัด</SelectItem>
              {(Object.keys(measureLabel) as Measure[]).map((m) => (
                <SelectItem key={m} value={m}>{measureLabel[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[170px]" aria-label="หมวด"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวด</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={freq} onValueChange={(v) => setFreq(v as typeof freq)}>
            <SelectTrigger className="w-[130px]" aria-label="ความถี่"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกความถี่</SelectItem>
              <SelectItem value="yearly">รายปี</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-[140px]" aria-label="สถานะ"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              {(["reviewed", "unreviewed"] as ReviewStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setQ(""); setMeasure("all"); setFreq("all"); setCategory("all"); setStatus("all") }}
            >
              <X />ล้างตัวกรอง
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">obs_id</TableHead>
                <TableHead>ตัวชี้วัด</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>ช่วงเวลา</TableHead>
                <TableHead className="text-right">ค่า</TableHead>
                <TableHead>หน่วย</TableHead>
                <TableHead>เซลล์ต้นฉบับ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.map((o) => (
                <TableRow key={o.obs_id} className="cursor-pointer" onClick={() => onTrace(observationTarget(o))}>
                  <TableCell className="text-muted-foreground font-mono text-xs">{o.obs_id}</TableCell>
                  <TableCell>{measureLabel[o.measure]}</TableCell>
                  <TableCell>{o.category}</TableCell>
                  <TableCell className="tabular-nums">{period(o)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {o.value === null ? <span className="text-muted-foreground">ว่าง</span> : o.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.unit_original}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{o.location_in_source}</TableCell>
                  <TableCell><StatusBadge status={o.review_status} /></TableCell>
                </TableRow>
              ))}
              {view.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">ไม่พบข้อมูลตามตัวกรอง</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {rows.length === 0 ? "0" : `${page * PAGE + 1}–${Math.min(rows.length, (page + 1) * PAGE)}`} จาก {rows.length} แถว
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">หน้า {page + 1} / {pages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="หน้าก่อน">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" className="size-8" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="หน้าถัดไป">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

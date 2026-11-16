import * as React from "react"
import { ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, ShieldQuestion } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusColor } from "@/components/status-badge"
import { exchanges, history, observations, qa, schema, sources, statusLabel, type ReviewStatus } from "@/lib/data"

const usedSources = new Set([...exchanges.map((e) => e.source_id), ...observations.map((o) => o.source_id)])

function StatusBar({ title, counts, total }: { title: string; counts: Record<string, number>; total: number }) {
  const order: ReviewStatus[] = ["reviewed", "held_context", "unreviewed", "conflict"]
  const parts = order.filter((s) => counts[s])
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground tabular-nums">{total} แถว</span>
      </div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
        {parts.map((s) => (
          <div key={s} title={`${statusLabel[s]} ${counts[s]}`} style={{ width: `${(counts[s] / total) * 100}%`, background: statusColor(s) }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((s) => (
          <span key={s} className="text-muted-foreground inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px]" style={{ background: statusColor(s) }} />
            {statusLabel[s]} <span className="text-foreground font-medium tabular-nums">{counts[s]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const PAGE = 8

export function QualityPanel() {
  return (
      <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>ผลการตรวจคุณภาพ (Quality Gate)</CardTitle>
          <CardDescription>สถานะ review_status ของทุกแถวในฐานข้อมูล</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <StatusBar title="LCI ระดับโรงไฟฟ้า (lci_exchange)" counts={qa.exchanges} total={exchanges.length} />
          <StatusBar title="สถิติไฟฟ้า (stat_observation)" counts={qa.observations} total={observations.length} />
          <p className="text-muted-foreground text-xs">
            แถว “ยังไม่ตรวจ” ในสถิติคือค่าว่าง (blank) {qa.blanks} ค่าที่ไม่นับเป็นข้อมูล
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>โครงสร้างฐานข้อมูล</CardTitle>
          <CardDescription>SQLite 3 · db/lci.db</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ["ตาราง", schema.tables],
              ["Trigger", schema.triggers],
              ["Foreign key", schema.foreign_keys],
              ["ดัชนี", schema.indexes],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg border p-3">
                <dt className="text-muted-foreground text-xs">{k}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

export function SourcesTable() {
  return (
      <Card>
        <CardHeader>
          <CardTitle>แหล่งข้อมูล ({sources.length})</CardTitle>
          <CardDescription>ทุกแถวอ้างรหัสแหล่ง SRC-xx · แหล่งที่มีข้อมูลในฐานข้อมูลตอนนี้มีป้าย “ใช้งาน”</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>ผู้เผยแพร่</TableHead>
                <TableHead>ปี/ฉบับ</TableHead>
                <TableHead>ระดับ</TableHead>
                <TableHead>สิทธิการใช้</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.source_id}>
                  <TableCell className="font-mono text-xs">
                    {s.source_id}
                    {usedSources.has(s.source_id) && <Badge className="ml-2" variant="secondary">ใช้งาน</Badge>}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal">{s.title}</TableCell>
                  <TableCell>{s.publisher.length > 24 ? s.publisher.split(" (")[0] : s.publisher}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-normal">{s.year}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.reporting_level}</TableCell>
                  <TableCell>
                    {s.license_status === "confirmed" ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <ShieldCheck style={{ color: "var(--status-good)" }} />
                        {s.license_note ?? "ยืนยันแล้ว"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground gap-1 font-normal">
                        <ShieldQuestion />
                        ยังไม่ยืนยัน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7" asChild>
                      <a href={s.url} target="_blank" rel="noreferrer" aria-label={`เปิด ${s.source_id}`}>
                        <ExternalLink />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  )
}

export function HistoryTable() {
  const [page, setPage] = React.useState(0)
  const sorted = [...history].reverse()
  const pages = Math.ceil(sorted.length / PAGE)
  const view = sorted.slice(page * PAGE, page * PAGE + PAGE)
  return (
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเปลี่ยนสถานะ (status_history)</CardTitle>
          <CardDescription>{history.length} รายการ · แก้หรือลบไม่ได้ (บังคับด้วย trigger)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>แถวเป้าหมาย</TableHead>
                <TableHead>เปลี่ยนจาก → เป็น</TableHead>
                <TableHead>ผู้เปลี่ยน</TableHead>
                <TableHead>เวลา</TableHead>
                <TableHead>เหตุผล</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.map((h) => (
                <TableRow key={h.history_id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">{h.history_id}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {h.exchange_id ? `exchange ${h.exchange_id}` : h.obs_id ? `obs ${h.obs_id}` : h.source_id}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{h.old_status}</span> → {h.new_status}
                  </TableCell>
                  <TableCell className="text-xs">{h.changed_by}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{h.changed_at}</TableCell>
                  <TableCell className="text-xs whitespace-normal">{h.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground">หน้า {page + 1} / {pages}</span>
            <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="หน้าก่อน">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" className="size-8" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="หน้าถัดไป">
              <ChevronRight />
            </Button>
          </div>
        </CardContent>
      </Card>
  )
}

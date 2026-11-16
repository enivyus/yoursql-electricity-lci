import * as React from "react"
import { Activity, ArrowRight, ChevronDown, Factory, FileCheck2, FileDown, Gauge, Search, ShieldCheck, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Story } from "@/components/story"
import { SectionHeading, nf0 } from "@/components/blocks"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"
import {
  capacityYearly, datasetStats, datasets, exchanges, fuelConfig, generationYearly, headline, latestYear, nf,
  observations, peakDemandYearly, qa, reviewedRows, snapshotFiles, sourceById, sources, totalRows, type Dataset,
} from "@/lib/data"

const groups = [
  { key: "all", label: "ทั้งหมด" },
  { key: "system", label: "ระดับระบบ" },
  { key: "plant", label: "ระดับโรงไฟฟ้า" },
] as const

// ---- sparklines (single series → no legend; card title names it) ----
const fuelKeys = Object.keys(fuelConfig)
const sparkData: Partial<Record<Dataset["id"], number[]>> = {
  generation: generationYearly.map((r) => fuelKeys.reduce((s, k) => s + (Number(r[k]) || 0), 0)),
  capacity: capacityYearly.map((r) => ["egat", "ipp", "spp", "imported"].reduce((s, k) => s + (Number(r[k]) || 0), 0)),
  system: peakDemandYearly.map((r) => r.value),
}

function Sparkline({ values }: { values: number[] }) {
  const w = 220, h = 48
  const min = Math.min(...values), max = Math.max(...values)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)])
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const last = pts.at(-1)!
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" aria-hidden preserveAspectRatio="none">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="var(--series-1)" opacity=".08" />
      <path d={d} fill="none" stroke="var(--series-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--series-1)" stroke="var(--card)" strokeWidth="2" />
    </svg>
  )
}

const icons: Record<Dataset["id"], typeof Zap> = { generation: Zap, capacity: Gauge, system: Activity, lci: Factory }

function DatasetCard({ d }: { d: Dataset }) {
  const s = datasetStats(d)
  const Icon = icons[d.id]
  const spark = sparkData[d.id]
  return (
    <div className="bg-card hover:border-primary/40 group flex flex-col rounded-2xl border p-5 transition-colors">
      <div className="flex items-start gap-3">
        <span className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <a href={href(`/data/${d.id}`)} className="font-semibold leading-snug underline-offset-4 group-hover:underline">{d.title}</a>
          <div className="text-muted-foreground mt-0.5 text-xs">{d.tag} · {d.tables}</div>
        </div>
      </div>
      <p className="text-foreground/80 mt-3 text-sm">{d.desc}</p>
      <div className="mt-4">
        {spark ? (
          <>
            <Sparkline values={spark} />
            <div className="text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums">
              <span>{s.coverage.match(/\d{4}/)?.[0]}</span>
              <span>{latestYear}</span>
            </div>
          </>
        ) : (
          <div className="grid h-[62px] grid-cols-2 gap-2 text-center">
            {(["IN", "OUT"] as const).map((dir) => (
              <div key={dir} className="bg-muted flex flex-col justify-center rounded-lg">
                <div className="text-lg font-semibold tabular-nums">{exchanges.filter((e) => e.direction === dir).length}</div>
                <div className="text-muted-foreground text-[11px]">{dir === "IN" ? "รายการขาเข้า" : "รายการขาออก"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="font-normal tabular-nums">{nf0(s.rows)} แถว</Badge>
        <Badge variant="outline" className="gap-1 font-normal tabular-nums">
          <ShieldCheck style={{ color: "var(--status-good)" }} />ตรวจแล้ว {nf0(s.reviewed)}
        </Badge>
      </div>
      <Collapsible className="mt-3 border-t pt-3">
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group/c flex w-full items-center justify-between text-xs">
          รายละเอียด
          <ChevronDown className="size-4 transition-transform group-data-[state=open]/c:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-2 text-sm">
            <div><span className="text-muted-foreground">ครอบคลุม:</span> {s.coverage}</div>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {d.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <a href={href(`/data/${d.id}`)} className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
        เปิดชุดข้อมูล <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  )
}

export function Home() {
  const [q, setQ] = React.useState("")
  const [applied, setApplied] = React.useState("")
  const [group, setGroup] = React.useState<(typeof groups)[number]["key"]>("all")
  const term = applied.trim().toLowerCase()
  const list = datasets.filter(
    (d) =>
      (group === "all" || d.group === group) &&
      (!term || [d.title, d.tag, d.desc, d.tables, ...d.sourceIds, ...d.notes].join(" ").toLowerCase().includes(term)),
  )
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setApplied(q)
    document.getElementById("datasets")?.scrollIntoView({ behavior: "smooth" })
  }
  const usedIds = new Set([...exchanges.map((e) => e.source_id), ...observations.map((o) => o.source_id)])
  const growth = headline.generation && headline.generationPrev ? ((headline.generation - headline.generationPrev) / headline.generationPrev) * 100 : 0

  return (
    <>
      <section className="border-b" style={{ background: "linear-gradient(180deg, var(--paper) 0%, var(--background) 100%)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Badge variant="outline" className="bg-card gap-1.5 rounded-full px-3 py-1 font-normal">
              <span className="size-1.5 rounded-full" style={{ background: "var(--status-good)" }} />
              ตรวจแล้ว {nf0(reviewedRows)} จาก {nf0(totalRows)} แถว
            </Badge>
            <h1 className="mt-5 text-4xl leading-tight font-bold tracking-tight sm:text-5xl sm:leading-tight">
              ไฟฟ้าไทยในตัวเลข
              <br />
              <span className="text-primary/70">ที่ตามรอยได้ทุกค่า</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-lg">
              สถิติไฟฟ้าระบบ กฟผ. 40 ปี และบัญชีรายการ LCI ของโรงไฟฟ้า คลิกตัวเลขไหนก็เห็นเซลล์ต้นฉบับกับ SHA-256 ของไฟล์
            </p>
            <form onSubmit={submit} className="bg-card mt-8 flex max-w-xl items-center gap-2 rounded-full border p-1.5 pl-4 shadow-sm">
              <Search className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ลองพิมพ์ ก๊าซ, peak, กำลังผลิต, LCI"
                className="h-10 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button type="submit" className="h-10 rounded-full px-6">ค้นหา</Button>
            </form>
            {applied && (
              <button onClick={() => { setQ(""); setApplied("") }} className="text-muted-foreground mt-3 ml-4 text-sm underline underline-offset-4">
                ล้างคำค้น “{applied}”
              </button>
            )}
          </div>

          <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl p-6 shadow-lg">
            <div className="text-primary-foreground/70 text-sm">ระบบไฟฟ้า กฟผ. · ปี {latestYear}</div>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6">
              {[
                { label: "ไฟฟ้าที่ผลิตได้", value: nf(headline.generation), unit: "GWh", foot: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% จากปีก่อน` },
                { label: "ความต้องการสูงสุด", value: nf(headline.peak), unit: "MW", foot: "peak demand" },
                { label: "กำลังผลิตติดตั้ง", value: nf(headline.capacity), unit: "MW", foot: "รวมทุกผู้ผลิต" },
                { label: "สัดส่วนก๊าซธรรมชาติ", value: `${headline.gasShare?.toFixed(0)}`, unit: "%", foot: "ของไฟฟ้าที่ผลิต" },
              ].map((k) => (
                <div key={k.label}>
                  <div className="text-primary-foreground/70 text-xs">{k.label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
                    {k.value}<span className="text-primary-foreground/70 ml-1 text-sm font-normal">{k.unit}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--electric)" }}>{k.foot}</div>
                </div>
              ))}
            </div>
            <div className="text-primary-foreground/60 mt-6 border-t border-white/15 pt-3 text-[11px]">ที่มา SRC-01 สนพ. ตาราง 5.1-1, 5.2-2, 5.2-5</div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-14">
        <section id="datasets" className="scroll-mt-24 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Datasets" title="ชุดข้อมูลในระบบ" desc={`${list.length} ชุด${applied ? ` ตรงกับ “${applied}”` : ""} · แต่ละชุดมีกราฟ ตาราง และดาวน์โหลด CSV`} />
            <div className="bg-muted flex gap-1 rounded-full p-1">
              {groups.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGroup(g.key)}
                  className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", group === g.key ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((d) => <DatasetCard key={d.id} d={d} />)}
          </div>
          {list.length === 0 && <p className="text-muted-foreground rounded-2xl border border-dashed py-12 text-center text-sm">ไม่พบชุดข้อมูลที่ตรงกับคำค้น</p>}
        </section>

        <Story />

        <section className="space-y-6">
          <SectionHeading eyebrow="Data pipeline" title="จากไฟล์ต้นทาง ถึงตัวเลขบนเว็บ" />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: FileDown, n: snapshotFiles.size, unit: "ไฟล์", title: "เก็บไฟล์ต้นทาง", text: "ดาวน์โหลดจากผู้เผยแพร่และล็อกด้วย SHA-256" },
              { icon: FileCheck2, n: totalRows, unit: "แถว", title: "ถอดค่าและตรวจ", text: "ถ้า hash, header หรือหน่วยผิด ระบบปฏิเสธทั้งชุด" },
              { icon: ShieldCheck, n: reviewedRows, unit: "แถว", title: "ผ่านการตรวจ", text: `พักตรวจ ${qa.exchanges.held_context ?? 0} · ค่าว่าง ${qa.blanks} · บันทึกประวัติทุกครั้ง แก้ไม่ได้` },
            ].map((st, i) => (
              <a key={st.title} href={href("/pipeline")} className="bg-card hover:border-primary/40 flex gap-4 rounded-2xl border p-5 transition-colors">
                <span className="bg-secondary text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"><st.icon className="size-5" /></span>
                <div>
                  <div className="text-muted-foreground text-xs">ขั้นที่ {i + 1} · {st.title}</div>
                  <div className="text-2xl font-semibold tabular-nums">{nf0(st.n)} <span className="text-muted-foreground text-sm font-normal">{st.unit}</span></div>
                  <div className="text-muted-foreground mt-1 text-sm">{st.text}</div>
                </div>
              </a>
            ))}
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              ใช้ข้อมูลจาก {[...usedIds].sort().map((id) => `${sourceById[id].publisher.split(" (")[0]} (${id})`).join(" และ ")} ·
              ลงทะเบียนแหล่งไว้ทั้งหมด {sources.length} แหล่ง
            </span>
            <a href={href("/sources")} className="text-primary inline-flex items-center gap-1 font-medium">ดูแหล่งข้อมูล <ArrowRight className="size-4" /></a>
            <a href={href("/pipeline")} className="text-primary inline-flex items-center gap-1 font-medium">ดูประวัติการตรวจ <ArrowRight className="size-4" /></a>
          </div>
        </section>
      </div>
    </>
  )
}

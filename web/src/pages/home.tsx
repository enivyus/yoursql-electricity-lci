import * as React from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { StatusBadge } from "@/components/status-badge"
import { Story } from "@/components/story"
import { SectionHeading, StatTiles, nf0 } from "@/components/blocks"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"
import { datasetStats, datasets, observations, exchanges, reviewedRows, sourceById, sources, totalRows, qa, type Dataset } from "@/lib/data"

const groups = [
  { key: "all", label: "ทั้งหมด" },
  { key: "system", label: "สถิติระบบ กฟผ." },
  { key: "plant", label: "ระดับโรงไฟฟ้า" },
] as const

function DatasetRow({ d }: { d: Dataset }) {
  const s = datasetStats(d)
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b py-5">
      <div className="space-y-1">
        <a href={href(`/data/${d.id}`)} className="text-lg font-semibold hover:underline underline-offset-4">{d.title}</a>
        <div className="text-muted-foreground text-sm">{d.tag}</div>
        <p className="text-sm">{d.desc}</p>
        <Collapsible>
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group mt-1 inline-flex items-center gap-1 text-xs">
            <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
            ช่วงข้อมูลและข้อควรรู้
          </CollapsibleTrigger>
          <CollapsibleContent>
            <dl className="mt-3 grid gap-x-8 gap-y-2 rounded-md border p-4 text-sm sm:grid-cols-[auto_1fr]" style={{ background: "var(--paper)" }}>
              <dt className="text-muted-foreground">ช่วงข้อมูล</dt>
              <dd>{s.coverage}</dd>
              <dt className="text-muted-foreground">แหล่ง</dt>
              <dd>{d.sourceIds.map((id) => `${id} ${sourceById[id].publisher.split(" (")[0]}`).join(", ")} · {d.tables}</dd>
              <dt className="text-muted-foreground">สถานะ</dt>
              <dd className="flex flex-wrap gap-2">
                <StatusBadge status="reviewed" /> <span className="tabular-nums">{nf0(s.reviewed)} จาก {nf0(s.rows)} แถว</span>
              </dd>
              <dt className="text-muted-foreground">ข้อควรรู้</dt>
              <dd>
                <ul className="list-disc space-y-1 pl-4">
                  {d.notes.map((n) => <li key={n}>{n}</li>)}
                </ul>
              </dd>
            </dl>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <a href={href(`/data/${d.id}`)} aria-label={`เปิด ${d.title}`} className="text-primary hover:bg-secondary rounded-full p-2">
        <ArrowRight className="size-6" />
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
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })
  }
  const usedIds = new Set([...exchanges.map((e) => e.source_id), ...observations.map((o) => o.source_id)])

  return (
    <>
      <section style={{ background: "var(--paper)" }}>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">ข้อมูลไฟฟ้าไทย</h1>
          <p className="text-muted-foreground mt-3 text-lg">เลือกชุดข้อมูล ดูตัวเลข และเปิดหลักฐานต้นทาง</p>
          <form onSubmit={submit} className="mt-8 flex max-w-3xl items-center gap-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาเชื้อเพลิง ชุดข้อมูล หรือหัวข้อ เช่น ก๊าซ, peak, LCI"
              className="bg-background h-12 text-base"
            />
            <Button type="submit" className="h-12 px-8">ค้นหา</Button>
            {applied && (
              <button type="button" onClick={() => { setQ(""); setApplied("") }} className="text-muted-foreground text-sm underline underline-offset-4">
                ล้าง
              </button>
            )}
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section id="explore" className="scroll-mt-20 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">สำรวจชุดข้อมูล</h2>
          <div className="flex gap-6 border-b">
            {groups.map((g) => (
              <button
                key={g.key}
                onClick={() => setGroup(g.key)}
                className={cn(
                  "relative pb-3 text-sm",
                  group === g.key ? "text-primary font-semibold after:bg-primary after:absolute after:inset-x-0 after:-bottom-px after:h-[3px]" : "text-foreground/75 hover:text-foreground",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            พบ {list.length} ชุดข้อมูล{applied && ` สำหรับ “${applied}”`} · กดชื่อเพื่อเปิดดูข้อมูลของแต่ละชุด
          </p>
          <div>
            {list.map((d) => <DatasetRow key={d.id} d={d} />)}
            {list.length === 0 && <p className="text-muted-foreground py-10 text-center text-sm">ไม่พบชุดข้อมูลที่ตรงกับคำค้น</p>}
          </div>
        </section>

        <section className="space-y-6">
          <a
            href={href("/pipeline")}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md px-6 py-5 text-sm hover:opacity-90"
            style={{ background: "var(--paper-strong)" }}
          >
            <span className="text-base font-semibold">ข้อมูลเดินทางมาอย่างไร</span>
            <span className="text-foreground/80">ไฟล์ต้นทาง</span><span aria-hidden>→</span>
            <span className="text-foreground/80">ตรวจคุณภาพ</span><span aria-hidden>→</span>
            <span className="text-foreground/80">เปิดดูข้อมูล</span>
          </a>
          <p className="text-muted-foreground text-xs">
            <span className="font-semibold" style={{ color: "var(--callout-edge)" }}>ที่มา</span>{" "}
            {[...usedIds].sort().map((id) => `${id} ${sourceById[id].publisher.split(" (")[0]}`).join(" · ")}
          </p>
          <Collapsible className="rounded-lg border">
            <CollapsibleTrigger className="group flex w-full items-center gap-2 px-6 py-4 text-sm font-semibold">
              <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />
              แหล่งที่ลงทะเบียนไว้แต่ยังไม่นำเข้า ({sources.length - usedIds.size})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="text-muted-foreground grid gap-1 px-6 pb-5 text-sm">
                {sources.filter((s) => !usedIds.has(s.source_id)).map((s) => (
                  <li key={s.source_id}><span className="text-foreground font-mono text-xs">{s.source_id}</span> · {s.publisher} · {s.title}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <Story />

        <section className="space-y-5">
          <SectionHeading eyebrow="คุณภาพข้อมูล" title="ทุกแถวผ่านการตรวจก่อนเปิดให้ดู" desc="ตัวเลขด้านล่างนับจากฐานข้อมูลจริง ณ รุ่นปัจจุบัน" />
          <StatTiles
            tiles={[
              { label: "แถวทั้งหมด", value: nf0(totalRows), sub: `LCI ${exchanges.length} · สถิติ ${observations.length}` },
              { label: "ตรวจแล้ว ย้อนต้นทางได้", value: nf0(reviewedRows), sub: "มีแหล่ง ตำแหน่ง และ SHA-256 ครบ", tone: "accept" },
              { label: "พักตรวจ", value: nf0(qa.exchanges.held_context ?? 0), sub: "ค่าที่ยังใช้คำนวณไม่ได้ เก็บค่าเดิมไว้ครบ" },
              { label: "ค่าว่างในต้นฉบับ", value: nf0(qa.blanks), sub: "ไม่นับเป็นข้อมูล" },
            ]}
          />
          <a href={href("/pipeline")} className="text-primary inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
            ดูขั้นตอนและประวัติการตรวจ <ArrowRight className="size-4" />
          </a>
        </section>
      </div>
    </>
  )
}

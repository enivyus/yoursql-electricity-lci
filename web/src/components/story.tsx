import * as React from "react"
import { ArrowDown, ArrowUpRight, MousePointerClick } from "lucide-react"
import { href } from "@/lib/router"
import { exchanges, headline, latestYear, nf } from "@/lib/data"

const ex = (flow: string) => exchanges.find((e) => e.flow === flow)

type NodeKey = "fuel" | "plant" | "emission" | "grid"
type Step = {
  key: NodeKey
  level: "ระดับระบบ" | "ระดับโรงไฟฟ้า"
  label: string
  value: string
  sub: string
  title: string
  body: React.ReactNode
  link: { to: string; label: string }
  dataset: string
  caveat: string
}

const steps: Step[] = [
  {
    key: "fuel", level: "ระดับระบบ", label: "เชื้อเพลิง",
    value: `ก๊าซ ${headline.gasShare?.toFixed(0)}%`, sub: `ของไฟฟ้าที่ผลิต ปี ${latestYear}`,
    title: "ก๊าซธรรมชาติยังเป็นเชื้อเพลิงหลัก",
    body: <>ในปี {latestYear} ไฟฟ้าระบบ กฟผ. ราว {headline.gasShare?.toFixed(0)}% ผลิตจากก๊าซธรรมชาติ ที่เหลือมาจากถ่านหิน การนำเข้า พลังงานหมุนเวียน และพลังน้ำ ดูย้อนหลังได้ถึงปี 1986</>,
    link: { to: "/data/generation", label: "ดูการผลิตแยกเชื้อเพลิง" },
    dataset: "SRC-01 สนพ. ตาราง 5.2-2",
    caveat: "สัดส่วนของระบบ กฟผ. ไม่ใช่ยอดทั้งประเทศ",
  },
  {
    key: "plant", level: "ระดับโรงไฟฟ้า", label: "โรงไฟฟ้า CHP",
    value: `${ex("Electricity")?.amount_original} MWh`, sub: `+ ไอน้ำ ${ex("Steam")?.amount_original} t ต่อปี`,
    title: "โรงไฟฟ้าเดียวได้ทั้งไฟฟ้าและไอน้ำ",
    body: <>โรงไฟฟ้าพลังความร้อนร่วมกรณีศึกษาใช้ก๊าซ {ex("Natural gas")?.amount_original} {ex("Natural gas")?.unit_original} ต่อปี ผลิตไฟฟ้า {ex("Electricity")?.amount_original} MWh และไอน้ำ {ex("Steam")?.amount_original} ตัน โดยปันส่วนผลกระทบด้วยวิธีประสิทธิภาพ</>,
    link: { to: "/data/lci", label: "เปิดบัญชีรายการ LCI" },
    dataset: "SRC-08 MATEC 2017 · Table 1",
    caveat: "ตัวเลขของโรงไฟฟ้ากรณีศึกษาเพียงโรงเดียว",
  },
  {
    key: "emission", level: "ระดับโรงไฟฟ้า", label: "การปล่อย",
    value: `CO₂ ${ex("CO2")?.amount_original}`, sub: "kg ต่อปี · พร้อม SO₂ ฝุ่น ของเสีย",
    title: "ทุกเมกะวัตต์ชั่วโมงมีสิ่งที่ปล่อยออกมา",
    body: <>โรงเดียวกันปล่อย CO₂ {ex("CO2")?.amount_original} kg ต่อปี รวมถึง SO₂ ฝุ่น และของเสีย ทุกค่าคลิกดูตำแหน่งในตารางต้นฉบับได้</>,
    link: { to: "/data/lci", label: "ดูรายการขาออก" },
    dataset: "SRC-08 MATEC 2017 · Table 1",
    caveat: "ค่าน้ำทิ้ง 4 รายการเป็นความเข้มข้น จึงพักตรวจไว้",
  },
  {
    key: "grid", level: "ระดับระบบ", label: "ระบบไฟฟ้า",
    value: `${nf(headline.capacity)} MW`, sub: `กำลังผลิต · peak ${nf(headline.peak)} MW`,
    title: "กำลังผลิตต้องรองรับวันที่ใช้ไฟสูงสุด",
    body: <>ปี {latestYear} ระบบมีกำลังผลิตติดตั้ง {nf(headline.capacity)} MW ขณะที่ความต้องการไฟฟ้าสูงสุดอยู่ที่ {nf(headline.peak)} MW</>,
    link: { to: "/data/system", label: "ดูความต้องการไฟฟ้า" },
    dataset: "SRC-01 สนพ. ตาราง 5.1-1, 5.2-5",
    caveat: "ฐานการผลิต gross / net ต่างกันตามช่วงปี",
  },
]
const byKey = Object.fromEntries(steps.map((s) => [s.key, s])) as Record<NodeKey, Step>

// ---- schematic layout (viewBox 960 × 330) ----
const W = 230, H = 112
const pos: Record<NodeKey, { x: number; y: number }> = {
  fuel: { x: 16, y: 34 },
  plant: { x: 365, y: 34 },
  grid: { x: 714, y: 34 },
  emission: { x: 365, y: 206 },
}
const links: { from: NodeKey; to: NodeKey; d: string; label: string; lx: number; ly: number; anchor?: "start" | "middle" }[] = [
  { from: "fuel", to: "plant", d: `M${16 + W} 90 H365`, label: "ป้อนเชื้อเพลิง", lx: 305, ly: 80 },
  { from: "plant", to: "grid", d: `M${365 + W} 90 H714`, label: "จ่ายเข้าระบบ", lx: 654, ly: 80 },
  { from: "plant", to: "emission", d: `M480 ${34 + H} V206`, label: "ปล่อยสู่สิ่งแวดล้อม", lx: 494, ly: 182, anchor: "start" },
]

function Schematic({ active, onSelect }: { active: NodeKey; onSelect: (k: NodeKey) => void }) {
  return (
    <svg viewBox="0 0 960 330" className="h-auto w-full" role="group" aria-label="แผนภาพห่วงโซ่ไฟฟ้า">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--axis)" />
        </marker>
        <marker id="arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--primary)" />
        </marker>
      </defs>

      {links.map((l) => {
        const on = l.from === active || l.to === active
        return (
          <g key={l.d}>
            <path
              d={l.d}
              fill="none"
              stroke={on ? "var(--primary)" : "var(--axis)"}
              strokeWidth={on ? 2.5 : 2}
              strokeDasharray="6 6"
              markerEnd={`url(#${on ? "arrow-on" : "arrow"})`}
              className={on ? "flow-dash" : undefined}
            />
            <text x={l.lx} y={l.ly} textAnchor={l.anchor ?? "middle"} fontSize="13" fill="var(--muted-foreground)">{l.label}</text>
          </g>
        )
      })}

      {steps.map((s, i) => {
        const p = pos[s.key]
        const on = s.key === active
        return (
          <g
            key={s.key}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            aria-label={`${s.label} ${s.value}`}
            onClick={() => onSelect(s.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(s.key)
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--ring)]"
          >
            <rect
              x={p.x} y={p.y} width={W} height={H} rx="14"
              fill={on ? "var(--primary)" : "var(--card)"}
              stroke={on ? "var(--primary)" : "var(--border)"}
              strokeWidth="1.5"
              style={{ transition: "fill .25s" }}
            />
            <text x={p.x + 18} y={p.y + 28} fontSize="13" fill={on ? "rgba(255,255,255,.75)" : "var(--muted-foreground)"}>
              {String(i + 1).padStart(2, "0")} · {s.label}
            </text>
            <text x={p.x + W - 16} y={p.y + 28} fontSize="11" textAnchor="end" fill={on ? "var(--electric)" : "var(--callout-edge)"}>
              {s.level}
            </text>
            <text x={p.x + 18} y={p.y + 64} fontSize="22" fontWeight="700" fill={on ? "#fff" : "var(--foreground)"} style={{ fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </text>
            <text x={p.x + 18} y={p.y + 90} fontSize="12.5" fill={on ? "rgba(255,255,255,.75)" : "var(--muted-foreground)"}>
              {s.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Detail({ s }: { s: Step }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h3>
        <p className="text-foreground/85 leading-relaxed">{s.body}</p>
        <p className="text-muted-foreground text-xs">
          ข้อมูลจาก {s.dataset} · <span style={{ color: "var(--callout-edge)" }}>{s.caveat}</span>
        </p>
      </div>
      <a
        href={href(s.link.to)}
        className="bg-primary text-primary-foreground inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        {s.link.label} <ArrowUpRight className="size-4" />
      </a>
    </div>
  )
}

export function Story() {
  const [active, setActive] = React.useState<NodeKey>("fuel")
  return (
    <section id="story" className="space-y-6">
      <div className="max-w-3xl space-y-3">
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--callout-edge)" }}>ห่วงโซ่ไฟฟ้า</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ตัวเลขแต่ละช่วง มาจากชุดข้อมูลไหน</h2>
        <p className="text-muted-foreground">
          แผนภาพเชื่อมชุดข้อมูลระดับระบบกับระดับโรงไฟฟ้าเข้าด้วยกัน ตัวเลขทุกตัวดึงจากฐานข้อมูลจริง
        </p>
      </div>

      {/* desktop: interactive schematic */}
      <div className="bg-card hidden overflow-hidden rounded-2xl border md:block">
        <div
          className="border-b px-6 pt-6 pb-4"
          style={{
            backgroundColor: "var(--paper)",
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <Schematic active={active} onSelect={setActive} />
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <MousePointerClick className="size-3.5" /> คลิกกล่องในแผนภาพเพื่อดูรายละเอียด
          </p>
        </div>
        <div className="p-6">
          <Detail s={byKey[active]} />
        </div>
      </div>

      {/* mobile: stacked flow */}
      <ol className="space-y-2 md:hidden">
        {steps.map((s, i) => (
          <li key={s.key}>
            {i > 0 && <ArrowDown aria-hidden className="text-muted-foreground mx-auto mb-2 size-4" />}
            <div className="bg-card rounded-2xl border p-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")} · {s.label}</span>
                <span style={{ color: "var(--callout-edge)" }}>{s.level}</span>
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums">{s.value}</div>
              <div className="text-muted-foreground text-xs">{s.sub}</div>
              <div className="mt-3 border-t pt-3">
                <Detail s={s} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

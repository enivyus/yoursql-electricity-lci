import * as React from "react"
import { ArrowUpRight, Cable, ChevronLeft, ChevronRight, Cloud, Factory, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"
import { exchanges, headline, latestYear, nf } from "@/lib/data"

const C = {
  sky: "#e8eef7", hillBack: "#c7d3e5", hillFront: "#97abc9", ground: "#6f86a8",
  ink: "#1e3a5f", sun: "#f5c542", cream: "#f4efe3", orange: "#f0a830", line: "#f3e3b5",
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-hidden>
      <rect width="400" height="260" fill={C.sky} />
      <circle cx="330" cy="62" r="30" fill={C.sun} />
      <path d="M60 60 l10 -18 l-2 12 l10 0 l-12 20 l3 -14z" fill={C.sun} opacity=".9" />
      <path d="M0 170 C 70 120 140 135 210 160 S 340 120 400 150 V260 H0 Z" fill={C.hillBack} />
      <path d="M0 205 C 90 175 170 190 250 200 S 360 180 400 190 V260 H0 Z" fill={C.hillFront} />
      <rect y="228" width="400" height="32" fill={C.ground} />
      {children}
    </svg>
  )
}

const amount = (flow: string) => exchanges.find((e) => e.flow === flow)

function SceneFuel() {
  return (
    <Backdrop>
      <path d="M-5 214 H150 V196 H200" fill="none" stroke={C.orange} strokeWidth="9" strokeLinejoin="round" />
      <rect x="196" y="150" width="120" height="78" rx="6" fill={C.cream} />
      <ellipse cx="256" cy="150" rx="60" ry="14" fill="#f6efdc" />
      <rect x="244" y="112" width="24" height="26" fill={C.ink} />
      <path d="M256 84 c14 12 12 22 0 28 c-12 -6 -14 -16 0 -28z" fill={C.orange} />
      <path d="M40 228 V188 M28 228 L40 188 L52 228" stroke={C.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
    </Backdrop>
  )
}
function ScenePlant() {
  return (
    <Backdrop>
      <rect x="110" y="140" width="190" height="88" rx="4" fill={C.cream} />
      <rect x="128" y="74" width="26" height="70" fill={C.ink} />
      <rect x="170" y="94" width="26" height="50" fill={C.ink} />
      <circle cx="258" cy="186" r="26" fill="none" stroke={C.ink} strokeWidth="6" />
      <path d="M258 162 V210 M234 186 H282" stroke={C.ink} strokeWidth="4" />
      <rect x="128" y="176" width="24" height="18" rx="3" fill={C.ink} />
      <rect x="166" y="176" width="24" height="18" rx="3" fill={C.ink} />
      <circle cx="141" cy="58" r="11" fill="#fff" opacity=".85" />
      <circle cx="156" cy="44" r="14" fill="#fff" opacity=".7" />
      <circle cx="183" cy="80" r="9" fill="#fff" opacity=".85" />
    </Backdrop>
  )
}
function SceneEmission() {
  return (
    <Backdrop>
      <rect x="150" y="96" width="34" height="132" fill={C.ink} />
      <rect x="150" y="112" width="34" height="8" fill={C.orange} />
      <g fill="#ffffff" opacity=".9">
        <circle cx="170" cy="74" r="20" /><circle cx="198" cy="58" r="26" /><circle cx="232" cy="66" r="20" />
      </g>
      <text x="198" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={C.ink} fontFamily="Noto Sans Thai, sans-serif">CO₂</text>
      <path d="M184 214 C 230 214 240 230 290 230" stroke="#7fb3c8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M300 196 c10 12 10 20 0 24 c-10 -4 -10 -12 0 -24z" fill="#7fb3c8" />
    </Backdrop>
  )
}
function SceneGrid() {
  const tower = (x: number) => (
    <g key={x} stroke={C.ink} strokeWidth="4" fill="none" strokeLinejoin="round">
      <path d={`M${x - 16} 228 L${x} 110 L${x + 16} 228`} />
      <path d={`M${x - 24} 130 H${x + 24} M${x - 18} 156 H${x + 18} M${x - 10} 190 L${x + 10} 170 M${x + 10} 190 L${x - 10} 170`} />
    </g>
  )
  return (
    <Backdrop>
      <path d="M46 130 Q 120 150 176 130 Q 230 150 280 136" stroke={C.ink} strokeWidth="2" fill="none" />
      {[70, 176].map(tower)}
      <path d="M282 228 V178 L318 152 L354 178 V228 Z" fill={C.cream} />
      <rect x="306" y="196" width="22" height="32" fill={C.ink} />
      <rect x="290" y="186" width="12" height="12" fill={C.sun} />
      <rect x="334" y="186" width="12" height="12" fill={C.sun} />
    </Backdrop>
  )
}

type Step = {
  key: string; icon: typeof Flame; short: string; sub: string; eyebrow: string; title: string
  body: React.ReactNode; link: { to: string; label: string }; caveat: string; scene: React.ReactNode
}

const steps: Step[] = [
  {
    key: "fuel", icon: Flame, short: "เชื้อเพลิง", sub: "ก๊าซ · ถ่านหิน · นำเข้า",
    eyebrow: "", title: "ก๊าซธรรมชาติยังเป็นเชื้อเพลิงหลัก",
    body: <>ในปี {latestYear} ไฟฟ้าระบบ กฟผ. ผลิตจากก๊าซธรรมชาติราว {headline.gasShare?.toFixed(0)}% ที่เหลือมาจากถ่านหิน การนำเข้า พลังงานหมุนเวียน และพลังน้ำ ดูได้ย้อนหลังถึงปี 1986</>,
    link: { to: "/data/generation", label: "ดูการผลิตแยกเชื้อเพลิง" },
    caveat: "สัดส่วนนี้เป็นของระบบ กฟผ. ไม่ใช่ยอดทั้งประเทศ",
    scene: <SceneFuel />,
  },
  {
    key: "plant", icon: Factory, short: "โรงไฟฟ้า", sub: "ไฟฟ้า · ไอน้ำ",
    eyebrow: "", title: "โรงไฟฟ้าเดียวได้ทั้งไฟฟ้าและไอน้ำ",
    body: <>โรงไฟฟ้าพลังความร้อนร่วมกรณีศึกษาใช้ก๊าซ {amount("Natural gas")?.amount_original} {amount("Natural gas")?.unit_original} ต่อปี ผลิตไฟฟ้า {amount("Electricity")?.amount_original} {amount("Electricity")?.unit_original} และไอน้ำ {amount("Steam")?.amount_original} ตัน</>,
    link: { to: "/data/lci", label: "เปิดบัญชีรายการ LCI" },
    caveat: "ตัวเลขรายปีจากโรงไฟฟ้ากรณีศึกษาเพียงโรงเดียว (2017)",
    scene: <ScenePlant />,
  },
  {
    key: "emission", icon: Cloud, short: "การปล่อย", sub: "อากาศ · น้ำ · ของเสีย",
    eyebrow: "", title: "ทุกเมกะวัตต์ชั่วโมงมีสิ่งที่ปล่อยออกมา",
    body: <>โรงเดียวกันปล่อย CO₂ {amount("CO2")?.amount_original} kg ต่อปี พร้อม SO₂ ฝุ่น และของเสีย ทุกค่าเปิดดูตำแหน่งในตารางต้นฉบับได้</>,
    link: { to: "/data/lci", label: "ดูรายการขาออก" },
    caveat: "ค่าน้ำทิ้งเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี จึงพักตรวจไว้",
    scene: <SceneEmission />,
  },
  {
    key: "grid", icon: Cable, short: "ระบบไฟฟ้า", sub: "กำลังผลิต · ความต้องการ",
    eyebrow: "", title: "กำลังผลิตต้องรองรับวันที่ใช้ไฟสูงสุด",
    body: <>ปี {latestYear} ระบบมีกำลังผลิตติดตั้ง {nf(headline.capacity)} MW ขณะที่ความต้องการไฟฟ้าสูงสุดอยู่ที่ {nf(headline.peak)} MW</>,
    link: { to: "/data/system", label: "ดูความต้องการไฟฟ้า" },
    caveat: "ฐานการผลิต gross / net ต่างกันตามช่วงปี",
    scene: <SceneGrid />,
  },
]

export function Story() {
  const [active, setActive] = React.useState(0)
  const s = steps[active]
  return (
    <section id="story" className="space-y-8">
      <div className="max-w-3xl space-y-3">
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--callout-edge)" }}>ไฟฟ้า 1 หน่วยมาจากไหน</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ตามไฟฟ้าย้อนกลับไปถึงต้นทาง</h2>
        <p className="text-muted-foreground">
          กดแต่ละขั้นเพื่อดูว่าข้อมูลชุดไหนเล่าเรื่องช่วงนั้น · ภาพเป็นแนวคิด ส่วนตัวเลขดึงจากฐานข้อมูลจริง
        </p>
      </div>

      <ol className="relative grid grid-cols-4 gap-2">
        <span aria-hidden className="bg-border absolute top-5 right-[12.5%] left-[12.5%] h-0.5" />
        <span
          aria-hidden
          className="bg-primary absolute top-5 left-[12.5%] h-0.5 transition-all duration-500"
          style={{ width: `${(active / (steps.length - 1)) * 75}%` }}
        />
        {steps.map((st, i) => (
          <li key={st.key} className="relative flex flex-col items-center text-center">
            <button
              onClick={() => setActive(i)}
              aria-label={`ขั้นที่ ${i + 1} ${st.short}`}
              aria-current={active === i ? "step" : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                i <= active ? "bg-primary border-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary/50",
              )}
            >
              <st.icon className="size-4" />
            </button>
            <button onClick={() => setActive(i)} className="mt-2 text-sm font-medium">{st.short}</button>
            <span className="text-muted-foreground hidden text-xs sm:block">{st.sub}</span>
          </li>
        ))}
      </ol>

      <div className="bg-card grid overflow-hidden rounded-2xl border lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-10">
          <div className="text-muted-foreground text-sm tabular-nums">ขั้นที่ {active + 1} จาก {steps.length}</div>
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h3>
          <p className="text-foreground/85 text-lg leading-relaxed">{s.body}</p>
          <p className="flex items-start gap-1.5 text-xs" style={{ color: "var(--callout-edge)" }}>
            <span aria-hidden>※</span>{s.caveat}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a href={href(s.link.to)} className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium hover:opacity-90">
              {s.link.label} <ArrowUpRight className="size-4" />
            </a>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full" disabled={active === 0} onClick={() => setActive((a) => a - 1)} aria-label="ขั้นก่อนหน้า">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" disabled={active === steps.length - 1} onClick={() => setActive((a) => a + 1)} aria-label="ขั้นถัดไป">
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
        <div className="order-first aspect-[400/260] lg:order-last lg:aspect-auto">{s.scene}</div>
      </div>
    </section>
  )
}

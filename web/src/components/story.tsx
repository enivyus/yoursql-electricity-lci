import * as React from "react"
import { ArrowUpRight, Cable, Cloud, Factory, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"
import { exchanges, headline, latestYear, nf } from "@/lib/data"

const C = {
  sky: "#e4ece3", hillBack: "#b4cbb6", hillFront: "#7c9b82", ground: "#5f8268",
  ink: "#24493b", sun: "#f1cf7c", cream: "#ece3cb", orange: "#e09a52", line: "#f3e3b5",
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" role="img" aria-hidden>
      <rect width="400" height="260" fill={C.sky} />
      <circle cx="330" cy="62" r="30" fill={C.sun} />
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
    eyebrow: "01 — ไฟฟ้ามาจากอะไร", title: "เริ่มที่เชื้อเพลิง",
    body: <>ในปี {latestYear} ไฟฟ้าระบบ กฟผ. ผลิตจากก๊าซธรรมชาติราว {headline.gasShare?.toFixed(0)}% ที่เหลือมาจากถ่านหิน การนำเข้า พลังงานหมุนเวียน และพลังน้ำ ดูได้ย้อนหลังถึงปี 1986</>,
    link: { to: "/data/generation", label: "ดูการผลิตแยกเชื้อเพลิง" },
    caveat: "สัดส่วนนี้เป็นของระบบ กฟผ. ไม่ใช่ยอดทั้งประเทศ",
    scene: <SceneFuel />,
  },
  {
    key: "plant", icon: Factory, short: "โรงไฟฟ้า", sub: "ไฟฟ้า · ไอน้ำ",
    eyebrow: "02 — แปลงเชื้อเพลิงเป็นพลังงาน", title: "ผ่านโรงไฟฟ้า",
    body: <>โรงไฟฟ้าพลังความร้อนร่วมกรณีศึกษาใช้ก๊าซ {amount("Natural gas")?.amount_original} {amount("Natural gas")?.unit_original} ต่อปี ผลิตไฟฟ้า {amount("Electricity")?.amount_original} {amount("Electricity")?.unit_original} และไอน้ำ {amount("Steam")?.amount_original} ตัน</>,
    link: { to: "/data/lci", label: "เปิดบัญชีรายการ LCI" },
    caveat: "ตัวเลขรายปีจากโรงไฟฟ้ากรณีศึกษาเพียงโรงเดียว (2017)",
    scene: <ScenePlant />,
  },
  {
    key: "emission", icon: Cloud, short: "การปล่อย", sub: "อากาศ · น้ำ · ของเสีย",
    eyebrow: "03 — สิ่งที่ออกมาพร้อมไฟฟ้า", title: "ปล่อยสู่สิ่งแวดล้อม",
    body: <>โรงเดียวกันปล่อย CO₂ {amount("CO2")?.amount_original} kg ต่อปี พร้อม SO₂ ฝุ่น และของเสีย ทุกค่าเปิดดูตำแหน่งในตารางต้นฉบับได้</>,
    link: { to: "/data/lci", label: "ดูรายการขาออก" },
    caveat: "ค่าน้ำทิ้งเป็นความเข้มข้น ไม่ใช่ปริมาณรายปี จึงพักตรวจไว้",
    scene: <SceneEmission />,
  },
  {
    key: "grid", icon: Cable, short: "ระบบไฟฟ้า", sub: "กำลังผลิต · ความต้องการ",
    eyebrow: "04 — เดินทางไปถึงผู้ใช้", title: "จากระบบส่ง ถึงความต้องการสูงสุด",
    body: <>ปี {latestYear} ระบบมีกำลังผลิตติดตั้ง {nf(headline.capacity)} MW ขณะที่ความต้องการไฟฟ้าสูงสุดอยู่ที่ {nf(headline.peak)} MW</>,
    link: { to: "/data/system", label: "ดูความต้องการไฟฟ้า" },
    caveat: "ฐานการผลิต gross / net ต่างกันตามช่วงปี",
    scene: <SceneGrid />,
  },
]

export function Story() {
  const [active, setActive] = React.useState(0)
  const refs = React.useRef<(HTMLElement | null)[]>([])

  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: "-45% 0px -45% 0px" },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (i: number) => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })

  return (
    <section id="story" className="space-y-8">
      <div className="space-y-4">
        <div className="text-primary text-xs font-semibold">เส้นทางของไฟฟ้า</div>
        <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-5xl sm:leading-tight">
          ก่อนไฟจะถึงปลั๊ก
          <br />
          ไฟฟ้าเดินทางผ่านอะไรบ้าง?
        </h2>
        <p className="text-muted-foreground">เลื่อนลงเพื่อเดินทางไปทีละช่วง หรือเลือกหมายเลขเพื่อข้ามไปอ่าน</p>
        <p className="text-muted-foreground border-l-2 pl-4 text-sm" style={{ borderColor: "var(--callout-edge)" }}>
          ภาพอธิบายแนวคิดเส้นทางของไฟฟ้า ไม่ใช่การคำนวณสมดุลพลังงาน · ตัวเลขทุกตัวดึงจากฐานข้อมูลจริง
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => go(i)}
            className={cn("bg-card hover:border-primary/40 rounded-lg border p-4 text-left transition-colors", active === i && "border-primary/60")}
          >
            <s.icon className="text-primary size-6" />
            <div className="mt-3 font-semibold">{s.short}</div>
            <div className="text-muted-foreground text-xs">{s.sub}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-xl border" style={{ background: "var(--paper)" }}>
            <div className="bg-primary h-1 transition-all duration-500" style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
            <div className="aspect-[400/260]">{steps[active].scene}</div>
            <div className="space-y-3 p-5">
              <div className="text-muted-foreground text-sm tabular-nums">0{active + 1} / 0{steps.length}</div>
              <div className="text-primary text-lg font-semibold">{steps[active].title}</div>
              <div className="flex gap-2">
                {steps.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => go(i)}
                    aria-label={`ไปช่วงที่ ${i + 1}`}
                    className={cn(
                      "size-9 rounded-md border text-sm tabular-nums transition-colors",
                      active === i ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          {steps.map((s, i) => (
            <article
              key={s.key}
              ref={(el) => { refs.current[i] = el }}
              data-i={i}
              className="flex min-h-[70vh] flex-col justify-center gap-4 py-10 lg:min-h-[80vh]"
            >
              <div className="overflow-hidden rounded-xl border lg:hidden">{s.scene}</div>
              <div className="text-primary text-xs font-semibold">{s.eyebrow}</div>
              <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">{s.title}</h3>
              <p className="text-foreground/85 text-lg leading-relaxed">{s.body}</p>
              <a href={href(s.link.to)} className="text-primary inline-flex w-fit items-center gap-1 border-b border-current pb-1 text-sm font-semibold">
                {s.link.label} <ArrowUpRight className="size-4" />
              </a>
              <p className="text-xs" style={{ color: "var(--callout-edge)" }}>{s.caveat}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

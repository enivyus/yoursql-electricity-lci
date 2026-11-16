import sourcesJson from "@/data/sources.json"
import processJson from "@/data/process.json"
import exchangesJson from "@/data/exchanges.json"
import observationsJson from "@/data/observations.json"
import historyJson from "@/data/history.json"
import schemaJson from "@/data/schema.json"
import type { ChartConfig } from "@/components/ui/chart"

export type ReviewStatus = "unreviewed" | "reviewed" | "held_context" | "conflict"

export type Source = {
  source_id: string; title: string; publisher: string; year: string; url: string
  source_ref: string; reporting_level: string; license_status: "confirmed" | "unconfirmed"; license_note: string | null
}
export type Process = {
  process_id: number; name: string; domain: string; reporting_level: string; reference_basis: string
  functional_unit: string | null; system_boundary: string | null; allocation_method: string | null
  data_period: string; year_type: string; publication_year: number | null
  location_name: string; country: string; source_id: string
}
export type Provenance = {
  location_in_source: string; snapshot_file: string; snapshot_sha256: string; retrieved_on: string
  review_status: ReviewStatus; source_id: string
}
export type Exchange = Provenance & {
  exchange_id: number; process_id: number; flow: string; flow_type: string; compartment: string | null
  direction: "IN" | "OUT"; amount_original: string; amount: number | null; unit_original: string
  quantity: string; is_reference: number; allocation_stage: string; cited_document: string | null; remark: string | null
}
export type Observation = Provenance & {
  obs_id: number; dataset_ref: string; measure: Measure; category: string; category_kind: string
  frequency: "yearly" | "monthly"; year_label: string; year_ce: number; month: number | null
  year_type: string; is_preliminary: number; capacity_type: string | null; generation_basis: string | null
  value_original: string; value: number | null; value_flag: "value" | "blank"; unit_original: string
}
export type History = {
  history_id: number; exchange_id: number | null; obs_id: number | null; source_id: string | null
  status_field: string; old_status: string; new_status: string; changed_by: string; changed_at: string; reason: string
}
export type Measure = "generation" | "installed_capacity" | "peak_demand" | "load_factor"

export const sources = sourcesJson as Source[]
export const process = (processJson as Process[])[0]
export const exchanges = exchangesJson as Exchange[]
export const observations = observationsJson as Observation[]
export const history = historyJson as History[]
export const schema = schemaJson as { tables: number; triggers: number; indexes: number; foreign_keys: number }

export const sourceById = Object.fromEntries(sources.map((s) => [s.source_id, s]))

// ---------- labels ----------
export const measureLabel: Record<Measure, string> = {
  generation: "พลังงานไฟฟ้าที่ผลิต",
  installed_capacity: "กำลังผลิตติดตั้ง",
  peak_demand: "ความต้องการไฟฟ้าสูงสุด",
  load_factor: "ตัวประกอบการใช้ไฟฟ้า",
}
export const statusLabel: Record<ReviewStatus, string> = {
  reviewed: "ตรวจแล้ว",
  unreviewed: "ยังไม่ตรวจ",
  held_context: "พักตรวจ",
  conflict: "ขัดแย้ง",
}
export const monthTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

// ---------- chart configs (fixed slot order = entity identity, never re-ordered) ----------
export const fuelConfig = {
  gas: { label: "ก๊าซธรรมชาติ", color: "var(--series-1)" },
  coal: { label: "ถ่านหินและลิกไนต์", color: "var(--series-2)" },
  hydro: { label: "พลังน้ำ", color: "var(--series-3)" },
  imported: { label: "นำเข้า", color: "var(--series-4)" },
  renewable: { label: "พลังงานหมุนเวียน", color: "var(--series-5)" },
  oil: { label: "น้ำมันเตา", color: "var(--series-6)" },
  diesel: { label: "ดีเซล", color: "var(--series-7)" },
} satisfies ChartConfig
export type FuelKey = keyof typeof fuelConfig
const fuelKeyByCategory: Record<string, FuelKey> = {
  "Natural Gas": "gas", "Coal & Lignite": "coal", "Hydro Electricity": "hydro", Imported: "imported",
  "Renewable Energy": "renewable", "Fuel Oil": "oil", Diesel: "diesel",
}

export const producerConfig = {
  egat: { label: "กฟผ. (EGAT)", color: "var(--series-1)" },
  ipp: { label: "IPP", color: "var(--series-2)" },
  spp: { label: "SPP", color: "var(--series-3)" },
  imported: { label: "นำเข้า", color: "var(--series-4)" },
} satisfies ChartConfig
const producerKey: Record<string, keyof typeof producerConfig> = { EGAT: "egat", IPP: "ipp", SPP: "spp", Imported: "imported" }

// ---------- derived series ----------
type Row = Record<string, number | string | null>

function pivot(rows: Observation[], key: (o: Observation) => string, col: (o: Observation) => string | undefined) {
  const map = new Map<string, Row>()
  for (const o of rows) {
    const c = col(o)
    if (!c) continue
    const k = key(o)
    const r = map.get(k) ?? { key: k, year: o.year_ce, month: o.month }
    r[c] = o.value
    map.set(k, r)
  }
  return [...map.values()]
}

export const generationYearly = pivot(
  observations.filter((o) => o.dataset_ref === "EPPO-T05-02-02" && o.category_kind === "fuel"),
  (o) => String(o.year_ce),
  (o) => fuelKeyByCategory[o.category],
).sort((a, b) => Number(a.year) - Number(b.year))

export const generationMonthly = pivot(
  observations.filter((o) => o.dataset_ref === "EPPO-T05-02-02M" && o.category_kind === "fuel"),
  (o) => `${o.year_ce}-${String(o.month).padStart(2, "0")}`,
  (o) => fuelKeyByCategory[o.category],
)
  .filter((r) => Object.keys(fuelConfig).some((k) => typeof r[k] === "number"))
  .sort((a, b) => String(a.key).localeCompare(String(b.key)))

export const capacityYearly = pivot(
  observations.filter((o) => o.measure === "installed_capacity" && o.category_kind === "producer"),
  (o) => String(o.year_ce),
  (o) => producerKey[o.category],
).sort((a, b) => Number(a.year) - Number(b.year))

function systemSeries(measure: Measure) {
  return observations
    .filter((o) => o.dataset_ref === "EPPO-T05-02-05" && o.measure === measure && o.value !== null)
    .map((o) => ({ year: o.year_ce, value: o.value as number, basis: o.generation_basis }))
    .sort((a, b) => a.year - b.year)
}
export const peakDemandYearly = systemSeries("peak_demand")
export const loadFactorYearly = systemSeries("load_factor")

const genTotal = observations.filter((o) => o.dataset_ref === "EPPO-T05-02-02" && o.category === "Total" && o.value !== null)
export const latestYear = Math.max(...genTotal.map((o) => o.year_ce))
const valueAt = (pred: (o: Observation) => boolean) => observations.find(pred)?.value ?? null
export const headline = {
  generation: valueAt((o) => o.dataset_ref === "EPPO-T05-02-02" && o.category === "Total" && o.year_ce === latestYear),
  generationPrev: valueAt((o) => o.dataset_ref === "EPPO-T05-02-02" && o.category === "Total" && o.year_ce === latestYear - 1),
  peak: valueAt((o) => o.dataset_ref === "EPPO-T05-02-05" && o.measure === "peak_demand" && o.year_ce === latestYear),
  capacity: valueAt((o) => o.measure === "installed_capacity" && o.category === "Total" && o.year_ce === latestYear),
  gasShare: (() => {
    const r = generationYearly.find((g) => g.year === latestYear)
    if (!r) return null
    const tot = Object.keys(fuelConfig).reduce((s, k) => s + (Number(r[k]) || 0), 0)
    return (Number(r.gas) / tot) * 100
  })(),
}

// ---------- QA counts ----------
function countBy<T>(arr: T[], f: (x: T) => string) {
  return arr.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {})
}
export const qa = {
  exchanges: countBy(exchanges, (e) => e.review_status),
  observations: countBy(observations, (o) => o.review_status),
  blanks: observations.filter((o) => o.value_flag === "blank").length,
}
export const totalRows = exchanges.length + observations.length
export const reviewedRows = (qa.exchanges.reviewed ?? 0) + (qa.observations.reviewed ?? 0)

// ---------- format ----------
export const nf = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: digits })
export const compact = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : String(v)

// ---------- datasets (one page each) ----------
export type DatasetId = "generation" | "capacity" | "system" | "lci"
export type Dataset = {
  id: DatasetId
  group: "system" | "plant"
  title: string
  tag: string
  desc: string
  sourceIds: string[]
  tables: string
  notes: string[]
  obs: Observation[]
}

const byRefs = (...refs: string[]) => observations.filter((o) => refs.includes(o.dataset_ref))

export const datasets: Dataset[] = [
  {
    id: "generation",
    group: "system",
    title: "การผลิตไฟฟ้าแยกตามเชื้อเพลิง",
    tag: "EPPO · รายปีและรายเดือน",
    desc: "พลังงานไฟฟ้าที่ระบบ กฟผ. ผลิตได้ แยกตามชนิดเชื้อเพลิง 7 ชนิด พร้อมยอดรวม",
    sourceIds: ["SRC-01"],
    tables: "ตาราง 5.2-2",
    notes: [
      "เป็นข้อมูลระดับระบบ กฟผ. (egat_system) ไม่ใช่ยอดทั้งประเทศ",
      "ปี 1986 ช่องพลังงานหมุนเวียนในต้นฉบับว่าง จึงเก็บเป็นค่าว่างและไม่นับ",
    ],
    obs: byRefs("EPPO-T05-02-02", "EPPO-T05-02-02M"),
  },
  {
    id: "capacity",
    group: "system",
    title: "กำลังผลิตติดตั้งแยกตามผู้ผลิต",
    tag: "EPPO · รายปี",
    desc: "กำลังผลิตติดตั้งของ กฟผ., IPP, SPP และการนำเข้า พร้อมยอดรวม",
    sourceIds: ["SRC-01"],
    tables: "ตาราง 5.1-1",
    notes: ["ทุกค่าเป็นกำลังผลิตติดตั้ง (installed) ไม่ใช่กำลังผลิตตามสัญญา"],
    obs: byRefs("EPPO-T05-01-01"),
  },
  {
    id: "system",
    group: "system",
    title: "ความต้องการไฟฟ้าสูงสุดและตัวประกอบการใช้ไฟฟ้า",
    tag: "EPPO · รายปีและรายเดือน",
    desc: "Peak demand, พลังงานไฟฟ้าที่ผลิตรวม และ load factor ของระบบ กฟผ.",
    sourceIds: ["SRC-01"],
    tables: "ตาราง 5.2-5",
    notes: [
      "ฐานการผลิต (gross / net) ต่างกันไปตามช่วงปีตามที่ต้นฉบับระบุ จึงไม่ควรเทียบข้ามช่วงโดยตรง",
      "เดือน ก.ย.–ธ.ค. 2026 ยังว่างในต้นฉบับ เก็บเป็นค่าว่างและไม่นับ",
    ],
    obs: byRefs("EPPO-T05-02-05", "EPPO-T05-02-05M"),
  },
  {
    id: "lci",
    group: "plant",
    title: "บัญชีรายการ LCI โรงไฟฟ้าก๊าซธรรมชาติ (CHP)",
    tag: "MATEC 2017 · ต่อปี",
    desc: "วัตถุดิบเข้า ผลผลิต และการปล่อยของโรงไฟฟ้าพลังความร้อนร่วมกรณีศึกษาในไทย",
    sourceIds: ["SRC-08"],
    tables: "Table 1 (p.5)",
    notes: [
      "ตัวเลขเป็นปริมาณรวมรายปีของโรงไฟฟ้ากรณีศึกษาเพียงโรงเดียว ไม่ใช่ค่าเฉลี่ยของประเทศ",
      "ค่าน้ำทิ้ง 4 รายการรายงานเป็นความเข้มข้น (mg/l) จึงพักตรวจไว้ ไม่นำไปรวมกับปริมาณรายปี",
    ],
    obs: [],
  },
]
export const datasetById = Object.fromEntries(datasets.map((d) => [d.id, d])) as Record<DatasetId, Dataset>

export function datasetStats(d: Dataset) {
  if (d.id === "lci") {
    return {
      rows: exchanges.length,
      reviewed: qa.exchanges.reviewed ?? 0,
      held: qa.exchanges.held_context ?? 0,
      blank: 0,
      coverage: "ปีพิมพ์ 2017 · ปริมาณต่อปี",
    }
  }
  const yearly = d.obs.filter((o) => o.frequency === "yearly")
  const monthly = d.obs.filter((o) => o.frequency === "monthly" && o.value !== null)
  const years = yearly.map((o) => o.year_ce)
  const parts = [`รายปี ${Math.min(...years)}–${Math.max(...years)}`]
  if (monthly.length) {
    const keys = monthly.map((o) => o.year_ce * 100 + (o.month ?? 0)).sort((a, b) => a - b)
    const fmt = (k: number) => `${monthTH[(k % 100) - 1]} ${Math.floor(k / 100)}`
    parts.push(`รายเดือน ${fmt(keys[0])} – ${fmt(keys.at(-1)!)}`)
  }
  return {
    rows: d.obs.length,
    reviewed: d.obs.filter((o) => o.review_status === "reviewed").length,
    held: d.obs.filter((o) => o.review_status === "held_context").length,
    blank: d.obs.filter((o) => o.value_flag === "blank").length,
    coverage: parts.join(" · "),
  }
}

export const snapshotFiles = new Set([...exchanges.map((e) => e.snapshot_file), ...observations.map((o) => o.snapshot_file)])

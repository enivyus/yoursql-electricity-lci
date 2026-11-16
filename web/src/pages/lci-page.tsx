import { ExternalLink } from "lucide-react"
import { Breadcrumb, Callout, StatTiles, nf0 } from "@/components/blocks"
import { Lci } from "@/components/lci"
import type { TraceTarget } from "@/components/provenance-sheet"
import { datasetById, datasetStats, sourceById } from "@/lib/data"

export function LciPage({ onTrace }: { onTrace: (t: TraceTarget) => void }) {
  const d = datasetById.lci
  const s = datasetStats(d)
  const src = sourceById[d.sourceIds[0]]
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: "ข้อมูลไฟฟ้า", to: "/" }, { label: d.title }]} />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2"><span className="bg-secondary text-primary rounded-full px-3 py-0.5 text-xs font-medium">{d.tag}</span><span className="text-muted-foreground rounded-full border px-3 py-0.5 text-xs">{d.tables}</span></div>
          <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
          <p className="text-muted-foreground max-w-3xl">
            {d.desc} · {src.license_note}{" "}
            <a href={src.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-0.5 underline-offset-4 hover:underline">
              DOI <ExternalLink className="size-3" />
            </a>
          </p>
        </div>
      </div>
      <StatTiles
        tiles={[
          { label: "รายการจากต้นฉบับ", value: nf0(s.rows), sub: "Table 1 ทุกแถว" },
          { label: "ผ่านการตรวจ", value: nf0(s.reviewed), sub: "เทียบกับ PDF ครบทุกค่า", tone: "accept" },
          { label: "พักตรวจ", value: nf0(s.held), sub: "ค่าที่ยังใช้คำนวณไม่ได้" },
          { label: "สิทธิการใช้", value: src.license_note ?? "—", sub: "บทความ Open Access" },
        ]}
      />
      <Callout title="ก่อนนำไปใช้"><ul className="list-disc space-y-0.5 pl-4">{d.notes.map((n) => <li key={n}>{n}</li>)}</ul></Callout>
      <Lci onTrace={onTrace} />
    </div>
  )
}

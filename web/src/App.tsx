import * as React from "react"
import { SiteHeader } from "@/components/site-header"
import { ProvenanceSheet, type TraceTarget } from "@/components/provenance-sheet"
import { Home } from "@/pages/home"
import { DatasetPage } from "@/pages/dataset"
import { LciPage } from "@/pages/lci-page"
import { Pipeline } from "@/pages/pipeline"
import { SourcesPage } from "@/pages/sources-page"
import { useRoute, href } from "@/lib/router"
import { datasetById, type DatasetId } from "@/lib/data"

const REPO = "https://github.com/enivyus/yoursql-electricity-lci"

export default function App() {
  const route = useRoute()
  const [trace, setTrace] = React.useState<TraceTarget | null>(null)

  let page: React.ReactNode
  const m = route.match(/^\/data\/(\w+)$/)
  if (m && m[1] === "lci") page = <LciPage onTrace={setTrace} />
  else if (m && datasetById[m[1] as DatasetId]) page = <DatasetPage d={datasetById[m[1] as DatasetId]} onTrace={setTrace} />
  else if (route === "/pipeline") page = <Pipeline />
  else if (route === "/sources") page = <SourcesPage />
  else page = <Home />

  React.useEffect(() => setTrace(null), [route])

  React.useEffect(() => {
    const d = m ? datasetById[m[1] as DatasetId] : null
    document.title = d ? `${d.title} · YourSQL` : "ข้อมูลไฟฟ้าไทย · YourSQL"
  }, [route]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader route={route} />
      <main id="main" className="flex-1">{page}</main>
      <footer className="mt-16 border-t" style={{ background: "var(--paper)" }}>
        <div className="text-muted-foreground mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-primary text-lg font-bold">YourSQL</div>
            <div>CN230 Database Systems × MTEC · ทีม S2-G01</div>
            <a href={REPO} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">GitHub repository</a>
          </div>
          <div className="space-y-1">
            <div className="text-foreground font-medium">ทีม</div>
            <div>ชลันธร ศรีนวนจันทร์ · PM/BA, SQL Lead, QA Lead</div>
            <div>สิทธิศักดิ์ มงคลสวัสดิ์ · Data Lead, Schema Lead</div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="text-foreground text-sm font-medium">สิทธิการใช้ข้อมูล</div>
            <div>SRC-08: CC BY 4.0 (MATEC Web of Conferences 103, 05009, 2017)</div>
            <div>SRC-01: สถิติ สนพ. สิทธิการเผยแพร่ซ้ำยังไม่ยืนยัน ใช้เพื่อการศึกษา</div>
            <a href={href("/sources")} className="underline underline-offset-4">ดูแหล่งข้อมูลทั้งหมด</a>
          </div>
        </div>
      </footer>
      <ProvenanceSheet target={trace} onOpenChange={(o) => !o && setTrace(null)} />
    </div>
  )
}

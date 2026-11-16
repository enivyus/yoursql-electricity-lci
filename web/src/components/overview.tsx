import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  capacityYearly, compact, fuelConfig, generationMonthly, generationYearly, loadFactorYearly,
  monthTH, nf, peakDemandYearly, producerConfig,
} from "@/lib/data"

const axis = { tickLine: false, axisLine: false, tickMargin: 8 } as const
const fuelKeys = Object.keys(fuelConfig) as (keyof typeof fuelConfig)[]
const producerKeys = Object.keys(producerConfig) as (keyof typeof producerConfig)[]

function Source({ children }: { children: React.ReactNode }) {
  return <CardFooter className="text-muted-foreground text-xs">{children}</CardFooter>
}

export function GenerationByFuel() {
  const [mode, setMode] = React.useState<"abs" | "share">("abs")
  const [range, setRange] = React.useState("all")
  const data = generationYearly.filter((r) => range === "all" || Number(r.year) >= Number(range))
  return (
    <Card>
      <CardHeader>
        <CardTitle>การผลิตไฟฟ้าระบบ กฟผ. แยกตามเชื้อเพลิง</CardTitle>
        <CardDescription>รายปี {String(data[0]?.year)}–{String(data.at(-1)?.year)} · หน่วย {mode === "abs" ? "GWh" : "% ของทั้งหมด"}</CardDescription>
        <CardAction className="flex flex-wrap gap-2 sm:justify-end">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "abs" | "share")}>
            <TabsList>
              <TabsTrigger value="abs">ปริมาณ</TabsTrigger>
              <TabsTrigger value="share">สัดส่วน</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]" aria-label="ช่วงปี">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด (40 ปี)</SelectItem>
              <SelectItem value="2006">20 ปีล่าสุด</SelectItem>
              <SelectItem value="2016">10 ปีล่าสุด</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={fuelConfig} className="aspect-auto h-[320px] w-full">
          <AreaChart data={data} stackOffset={mode === "share" ? "expand" : "none"} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" {...axis} minTickGap={24} />
            <YAxis {...axis} width={48} tickFormatter={(v: number) => (mode === "share" ? `${Math.round(v * 100)}%` : compact(v))} />
            <Tooltip
              cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
              content={(p) => (
                <ChartTooltipContent
                  {...(p as object)}
                  reverse
                  hideTotal={false}
                  labelFormatter={(l) => `ปี ${l}`}
                  valueFormatter={(v) => `${nf(v)} GWh`}
                />
              )}
            />
            {fuelKeys.map((k) => (
              <Area
                key={k}
                dataKey={k}
                type="monotone"
                stackId="a"
                stroke="var(--card)"
                strokeWidth={1}
                fill={`var(--color-${k})`}
                fillOpacity={0.9}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        <ChartLegend config={fuelConfig} />
      </CardContent>
      <Source>ที่มา: SRC-01 สนพ. (EPPO) ตาราง 5.2-2 · ปี 1986 ไม่มีค่าพลังงานหมุนเวียน (ช่องว่างในต้นฉบับ)</Source>
    </Card>
  )
}

export function CapacityByProducer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>กำลังผลิตติดตั้ง แยกตามผู้ผลิต</CardTitle>
        <CardDescription>รายปี 2001–2025 · MW</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={producerConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={capacityYearly} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" {...axis} minTickGap={16} />
            <YAxis {...axis} width={44} tickFormatter={compact} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={(p) => (
                <ChartTooltipContent {...(p as object)} reverse hideTotal={false} labelFormatter={(l) => `ปี ${l}`} valueFormatter={(v) => `${nf(v)} MW`} />
              )}
            />
            {producerKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="c"
                fill={`var(--color-${k})`}
                stroke="var(--card)"
                strokeWidth={1}
                radius={i === producerKeys.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
        <ChartLegend config={producerConfig} />
      </CardContent>
      <Source>ที่มา: SRC-01 สนพ. ตาราง 5.1-1</Source>
    </Card>
  )
}

export const peakConfig = { value: { label: "ความต้องการสูงสุด", color: "var(--series-1)" } } satisfies ChartConfig
export const lfConfig = { value: { label: "ตัวประกอบการใช้ไฟฟ้า", color: "var(--series-1)" } } satisfies ChartConfig

export function SingleLine({
  title, desc, data, config, unit, domain, source,
}: {
  title: string; desc: string; data: { year: number; value: number }[]; config: ChartConfig
  unit: string; domain?: [number, number]; source: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[220px] w-full">
          <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="year" {...axis} minTickGap={24} />
            <YAxis {...axis} width={44} domain={domain ?? ["auto", "auto"]} tickFormatter={(v: number) => (unit === "%" ? `${v}%` : compact(v))} />
            <Tooltip
              cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
              content={(p) => (
                <ChartTooltipContent {...(p as object)} labelFormatter={(l) => `ปี ${l}`} valueFormatter={(v) => `${nf(v, 2)} ${unit}`} />
              )}
            />
            <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <Source>{source}</Source>
    </Card>
  )
}

export function MonthlyGeneration() {
  const data = generationMonthly.map((r) => ({ ...r, label: `${monthTH[Number(r.month) - 1]} ${String(r.year).slice(2)}` }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>การผลิตไฟฟ้ารายเดือน แยกตามเชื้อเพลิง</CardTitle>
        <CardDescription>
          {data[0]?.label} – {data.at(-1)?.label} · GWh
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={fuelConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap={3}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" {...axis} minTickGap={12} />
            <YAxis {...axis} width={44} tickFormatter={compact} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={(p) => (
                <ChartTooltipContent {...(p as object)} reverse hideTotal={false} valueFormatter={(v) => `${nf(v)} GWh`} />
              )}
            />
            {fuelKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="m"
                fill={`var(--color-${k})`}
                stroke="var(--card)"
                strokeWidth={1}
                radius={i === fuelKeys.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
        <ChartLegend config={fuelConfig} />
      </CardContent>
      <Source>ที่มา: SRC-01 สนพ. ตาราง 5.2-2 (รายเดือน)</Source>
    </Card>
  )
}

export function Overview() {
  return (
    <div className="grid gap-4">
      <GenerationByFuel />
      <div className="grid gap-4 lg:grid-cols-2">
        <CapacityByProducer />
        <MonthlyGeneration />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SingleLine
          title="ความต้องการไฟฟ้าสูงสุด (Peak demand)"
          desc="รายปี 1986–2025 · MW"
          data={peakDemandYearly}
          config={peakConfig}
          unit="MW"
          source="ที่มา: SRC-01 สนพ. ตาราง 5.2-5"
        />
        <SingleLine
          title="ตัวประกอบการใช้ไฟฟ้า (Load factor)"
          desc="รายปี 1986–2025 · %"
          data={loadFactorYearly}
          config={lfConfig}
          unit="%"
          domain={[50, 90]}
          source="ที่มา: SRC-01 สนพ. ตาราง 5.2-5"
        />
      </div>
    </div>
  )
}

// shadcn/ui chart primitives (ChartContainer / ChartTooltipContent / ChartLegendContent)
// adapted for recharts v3
import * as React from "react"
import { ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label: string; color: string }>

const ChartContext = React.createContext<ChartConfig | null>(null)
function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used within <ChartContainer />")
  return ctx
}

function ChartContainer({
  config, className, children, ...props
}: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactElement }) {
  const style = Object.fromEntries(
    Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color]),
  ) as React.CSSProperties
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        style={style}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-(--grid) [&_.recharts-reference-line_line]:stroke-(--axis) [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden [&_.recharts-sector]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

type TooltipItem = { dataKey?: string | number; name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }

function ChartTooltipContent({
  active, payload, label, labelFormatter, valueFormatter, hideTotal = true, reverse = false,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  labelFormatter?: (label: string | number | undefined) => React.ReactNode
  valueFormatter?: (v: number) => string
  hideTotal?: boolean
  reverse?: boolean
}) {
  const config = useChart()
  if (!active || !payload?.length) return null
  const items = reverse ? [...payload].reverse() : payload
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString("th-TH", { maximumFractionDigits: 1 }))
  const total = items.reduce((s, p) => s + (typeof p.value === "number" ? p.value : 0), 0)
  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{labelFormatter ? labelFormatter(label) : label}</div>
      <div className="grid gap-1">
        {items.map((p) => {
          const key = String(p.dataKey ?? p.name)
          const cfg = config[key]
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: cfg?.color ?? p.color }} />
              <span className="text-muted-foreground flex-1">{cfg?.label ?? p.name}</span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                {typeof p.value === "number" ? fmt(p.value) : "—"}
              </span>
            </div>
          )
        })}
        {!hideTotal && (
          <div className="mt-0.5 flex items-center gap-2 border-t pt-1">
            <span className="flex-1 font-medium">รวม</span>
            <span className="font-mono font-medium tabular-nums">{fmt(total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ChartLegend({ config, keys, className }: { config: ChartConfig; keys?: string[]; className?: string }) {
  const list = keys ?? Object.keys(config)
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs", className)}>
      {list.map((k) => (
        <div key={k} className="text-muted-foreground flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: config[k].color }} />
          {config[k].label}
        </div>
      ))}
    </div>
  )
}

export { ChartContainer, ChartTooltipContent, ChartLegend }

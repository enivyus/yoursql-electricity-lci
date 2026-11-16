import * as React from "react"
import { ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          {i > 0 && <ChevronRight className="size-3.5" />}
          {it.to ? (
            <a href={href(it.to)} className="hover:text-foreground underline-offset-4 hover:underline">{it.label}</a>
          ) : (
            <span className="text-foreground">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export type Tile = { label: string; value: string; sub: string; tone?: "default" | "accept"; icon?: React.ComponentType<{ className?: string }> }

export function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className={cn("bg-card relative overflow-hidden rounded-xl border p-5", t.tone === "accept" && "border-primary/30")}>
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: t.tone === "accept" ? "var(--status-good)" : "var(--electric)", opacity: t.tone === "accept" ? 1 : 0.7 }}
          />
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            {t.icon && <t.icon className="size-4" />}
            {t.label}
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{t.value}</div>
          <div className="text-muted-foreground mt-1.5 text-xs">{t.sub}</div>
        </div>
      ))}
    </div>
  )
}

export function Callout({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex gap-3 rounded-xl border px-5 py-4 text-sm leading-relaxed", className)}
      style={{ background: "var(--callout)", borderColor: "color-mix(in srgb, var(--callout-edge) 35%, transparent)" }}
    >
      <Info className="mt-0.5 size-4 shrink-0" style={{ color: "var(--callout-edge)" }} />
      <div>
        {title && <div className="mb-0.5 font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, desc, className }: { eyebrow?: string; title: string; desc?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {eyebrow && <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--callout-edge)" }}>{eyebrow}</div>}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
    </div>
  )
}

export const nf0 = (n: number) => n.toLocaleString("en-US")

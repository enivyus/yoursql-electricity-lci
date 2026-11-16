import * as React from "react"
import { ChevronRight } from "lucide-react"
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

export type Tile = { label: string; value: string; sub: string; tone?: "default" | "accept" }

export function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="bg-card grid overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={cn(
            "border-border p-5",
            i > 0 && "border-t sm:border-t-0",
            i % 2 === 1 && "sm:border-l",
            i >= 2 && "sm:border-t lg:border-t-0",
            i > 0 && "lg:border-l",
            t.tone === "accept" && "bg-secondary",
          )}
        >
          <div className="text-muted-foreground text-sm">{t.label}</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{t.value}</div>
          <div className="text-muted-foreground mt-2 text-xs">{t.sub}</div>
        </div>
      ))}
    </div>
  )
}

export function Callout({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex gap-3 rounded-md border-l-4 px-5 py-4 text-sm leading-relaxed", className)}
      style={{ background: "var(--callout)", borderLeftColor: "var(--callout-edge)" }}
    >
      <span aria-hidden className="mt-0.5 font-bold" style={{ color: "var(--callout-edge)" }}>◉</span>
      <div>
        {title && <span className="mr-1 font-semibold">{title}</span>}
        {children}
      </div>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, desc, className }: { eyebrow?: string; title: string; desc?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {eyebrow && <div className="text-primary text-xs font-semibold">{eyebrow}</div>}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
    </div>
  )
}

export const nf0 = (n: number) => n.toLocaleString("en-US")

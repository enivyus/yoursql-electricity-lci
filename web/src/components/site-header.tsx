import * as React from "react"
import { ChevronDown, Menu, Zap } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { href } from "@/lib/router"
import { datasets } from "@/lib/data"

const links = [
  { to: "/", label: "หน้าแรก" },
  { to: "/pipeline", label: "เส้นทางข้อมูล" },
  { to: "/sources", label: "แหล่งข้อมูล" },
]

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href(to)}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground font-medium" : "text-foreground/75 hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </a>
  )
}

export function SiteHeader({ route }: { route: string }) {
  const [open, setOpen] = React.useState(false)
  const onData = route.startsWith("/data/")
  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <a href="#main" className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:px-3 focus:py-1">
        ข้ามไปเนื้อหาหลัก
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <a href={href("/")} className="flex items-center gap-2.5">
          <span className="bg-primary flex size-8 items-center justify-center rounded-lg">
            <Zap className="size-4" style={{ color: "var(--electric)", fill: "var(--electric)" }} />
          </span>
          <span className="leading-tight">
            <span className="text-primary block text-base font-bold tracking-tight">YourSQL</span>
            <span className="text-muted-foreground block text-[11px]">Thailand Electricity Data</span>
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink to="/" active={route === "/"}>หน้าแรก</NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm outline-none transition-colors",
                onData ? "bg-primary text-primary-foreground font-medium" : "text-foreground/75 hover:bg-secondary hover:text-foreground",
              )}
            >
              ชุดข้อมูล <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>สถิติระบบ กฟผ.</DropdownMenuLabel>
              {datasets.filter((d) => d.group === "system").map((d) => (
                <DropdownMenuItem key={d.id} asChild>
                  <a href={href(`/data/${d.id}`)} className="flex-col items-start gap-0">
                    <span>{d.title}</span>
                    <span className="text-muted-foreground text-xs">{d.tag}</span>
                  </a>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>ระดับโรงไฟฟ้า</DropdownMenuLabel>
              {datasets.filter((d) => d.group === "plant").map((d) => (
                <DropdownMenuItem key={d.id} asChild>
                  <a href={href(`/data/${d.id}`)} className="flex-col items-start gap-0">
                    <span>{d.title}</span>
                    <span className="text-muted-foreground text-xs">{d.tag}</span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {links.slice(1).map((l) => (
            <NavLink key={l.to} to={l.to} active={route === l.to}>{l.label}</NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
          <Menu />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="text-primary">YourSQL</SheetTitle>
            <SheetDescription>Thailand Electricity Data</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-1 px-4" onClick={() => setOpen(false)}>
            {links.map((l) => (
              <a key={l.to} href={href(l.to)} className={cn("rounded-md px-3 py-2 text-sm", route === l.to ? "bg-secondary text-primary font-semibold" : "hover:bg-muted")}>
                {l.label}
              </a>
            ))}
            <div className="text-muted-foreground mt-3 px-3 text-xs">ชุดข้อมูล</div>
            {datasets.map((d) => (
              <a key={d.id} href={href(`/data/${d.id}`)} className={cn("rounded-md px-3 py-2 text-sm", route === `/data/${d.id}` ? "bg-secondary text-primary font-semibold" : "hover:bg-muted")}>
                {d.title}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

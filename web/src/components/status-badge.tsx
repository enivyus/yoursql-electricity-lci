import { CircleCheck, CircleDashed, CirclePause, CircleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { statusLabel, type ReviewStatus } from "@/lib/data"

const map: Record<ReviewStatus, { icon: typeof CircleCheck; color: string }> = {
  reviewed: { icon: CircleCheck, color: "var(--status-good)" },
  unreviewed: { icon: CircleDashed, color: "var(--muted-foreground)" },
  held_context: { icon: CirclePause, color: "var(--status-warning)" },
  conflict: { icon: CircleAlert, color: "var(--status-critical)" },
}

/** Status always carries icon + label — never color alone. */
export function StatusBadge({ status }: { status: ReviewStatus }) {
  const { icon: Icon, color } = map[status]
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <Icon style={{ color }} />
      {statusLabel[status]}
    </Badge>
  )
}

export function statusColor(status: ReviewStatus) {
  return map[status].color
}

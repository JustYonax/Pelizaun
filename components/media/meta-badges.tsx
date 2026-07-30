import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function RatingBadge({
  rating,
  className,
  size = "sm",
}: {
  rating: number
  className?: string
  size?: "sm" | "md"
}) {
  const tone =
    rating >= 7.5
      ? "text-[var(--success)]"
      : rating >= 6
        ? "text-[var(--warning)]"
        : "text-muted-foreground"

  return (
    <span
      className={cn(
        "bg-background/70 inline-flex items-center gap-1 rounded-full border border-white/10 backdrop-blur-md",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        "font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      <Star className="size-3 fill-current" />
      {rating > 0 ? rating.toFixed(1) : "—"}
    </span>
  )
}

export function QualityBadge({
  quality,
  className,
}: {
  quality: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "border-cyan/40 text-cyan bg-cyan/10 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-md",
        className,
      )}
    >
      {quality}
    </span>
  )
}

export function LangBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground bg-background/70 inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur-md",
        className,
      )}
    >
      {label}
    </span>
  )
}

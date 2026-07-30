import { cn } from "@/lib/utils"

/** Marca de la aplicación: órbita sobre un núcleo luminoso. */
export function NebulaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl",
        "from-primary via-violet to-cyan bg-gradient-to-br",
        className,
      )}
      aria-hidden
    >
      <span className="bg-background/85 absolute inset-[2px] rounded-[10px]" />
      <svg viewBox="0 0 24 24" className="relative size-[62%]" fill="none">
        <circle cx="12" cy="12" r="3.2" fill="var(--cyan)" />
        <ellipse
          cx="12"
          cy="12"
          rx="9.4"
          ry="4.2"
          stroke="var(--primary)"
          strokeWidth="1.6"
          transform="rotate(-28 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="9.4"
          ry="4.2"
          stroke="var(--violet)"
          strokeWidth="1.6"
          opacity="0.85"
          transform="rotate(32 12 12)"
        />
      </svg>
    </span>
  )
}

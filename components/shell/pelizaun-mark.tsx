import { cn } from "@/lib/utils"

/** Marca de la aplicación: triángulo de play sobre un fondo degradado. */
export function PelizaunMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl",
        "from-primary via-violet to-cyan bg-gradient-to-br",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="relative size-[52%]" fill="none">
        <path
          d="M8 5.5v13c0 .87.95 1.4 1.69.94l10.2-6.5a1.1 1.1 0 0 0 0-1.88l-10.2-6.5A1.1 1.1 0 0 0 8 5.5Z"
          fill="white"
        />
      </svg>
    </span>
  )
}

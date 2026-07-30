import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"
import type { MediaItem } from "@/lib/types"
import { seeded, typeLabel } from "@/lib/format"

/** Fila de progreso. El porcentaje es estable por id para evitar saltos de hidratación. */
export function ContinueWatching({ items }: { items: MediaItem[] }) {
  if (!items.length) return null

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="font-display text-lg font-semibold sm:text-xl">
          Continuar viendo
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Retoma justo donde lo dejaste
        </p>
      </header>

      <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
        {items.map((item, index) => {
          const progress = 12 + seeded(item.id, 74)
          return (
            <Link
              key={`${item.mediaType}-${item.id}`}
              href={`/ver/${item.mediaType}/${item.id}`}
              className="group focus-visible:ring-ring w-[248px] shrink-0 snap-start rounded-2xl outline-none focus-visible:ring-2 sm:w-[300px]"
            >
              <div className="bg-card ring-border/60 relative aspect-video overflow-hidden rounded-2xl ring-1 transition-all duration-300 group-hover:ring-primary/50">
                {item.backdrop ? (
                  <Image
                    src={item.backdrop}
                    alt=""
                    fill
                    sizes="300px"
                    priority={index < 2}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="from-background/95 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

                <span className="bg-background/70 absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 scale-90 place-items-center rounded-full border border-white/20 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                  <Play className="size-4 translate-x-px fill-current" />
                </span>

                <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <div className="bg-muted/70 h-1 w-full overflow-hidden rounded-full">
                    <div
                      className="from-primary to-cyan h-full rounded-full bg-gradient-to-r"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-[11px] tabular-nums">
                    {progress}% · {typeLabel(item.mediaType)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

import Image from "next/image"
import Link from "next/link"
import { ImageOff, Play } from "lucide-react"
import type { MediaItem } from "@/lib/types"
import { languageLabel, qualityFor } from "@/lib/tmdb"
import { typeLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { LangBadge, QualityBadge, RatingBadge } from "@/components/media/meta-badges"

type Props = {
  item: MediaItem
  /** Índice dentro de la fila; solo las primeras imágenes tienen prioridad de carga. */
  index?: number
  className?: string
}

export function MediaCard({ item, index = 99, className }: Props) {
  return (
    <article className={cn("group/card relative", className)}>
      <Link
        href={`/titulo/${item.mediaType}/${item.id}`}
        className="focus-visible:ring-ring block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="bg-card ring-border/60 relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 transition-all duration-300 group-hover/card:ring-primary/50 group-hover/card:shadow-[0_24px_60px_-24px_oklch(0_0_0/0.9)]">
          {item.poster ? (
            <Image
              src={item.poster}
              alt={`Póster de ${item.title}`}
              fill
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 26vw, 208px"
              priority={index < 6}
              className="object-cover transition-transform duration-500 group-hover/card:scale-[1.06]"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <ImageOff className="size-7" />
            </div>
          )}

          {/* Degradado permanente inferior para legibilidad de badges. */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />

          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            <RatingBadge rating={item.rating} />
            <QualityBadge quality={item.quality || qualityFor(item.id)} />
          </div>

          {/* Capa hover: información adicional + play. */}
          <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-background via-background/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
            <span className="bg-primary text-primary-foreground shadow-primary/40 absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-[70%] scale-75 place-items-center rounded-full shadow-lg transition-transform duration-300 group-hover/card:scale-100">
              <Play className="size-5 translate-x-px fill-current" />
            </span>
            <p className="text-muted-foreground line-clamp-3 text-[11px] leading-relaxed">
              {item.overview || "Sin sinopsis disponible."}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <LangBadge label={languageLabel(item.language)} />
              <LangBadge label={typeLabel(item.mediaType)} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1 pt-3">
          <h3 className="group-hover/card:text-primary truncate text-sm font-semibold transition-colors">
            {item.title}
          </h3>
          <p className="text-muted-foreground text-xs tabular-nums">
            {item.year ?? "—"} · {typeLabel(item.mediaType)}
          </p>
        </div>
      </Link>
    </article>
  )
}

export function MediaCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted/60 aspect-[2/3] animate-pulse rounded-2xl" />
      <div className="flex flex-col gap-2 px-1">
        <div className="bg-muted/60 h-3.5 w-4/5 animate-pulse rounded-full" />
        <div className="bg-muted/40 h-3 w-2/5 animate-pulse rounded-full" />
      </div>
    </div>
  )
}

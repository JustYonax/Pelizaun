import Image from "next/image"
import Link from "next/link"
import { Play, Star } from "lucide-react"
import type { MediaDetail } from "@/lib/types"
import { formatRuntime, formatVotes, typeLabel } from "@/lib/format"
import { audioFor, languageLabel } from "@/lib/tmdb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/media/library-actions"
import { TrailerDialog } from "@/components/media/trailer-dialog"
import { QualityBadge } from "@/components/media/meta-badges"

export function Hero({ item }: { item: MediaDetail }) {
  const runtime =
    formatRuntime(item.runtime) ??
    (item.seasonsCount ? `${item.seasonsCount} temporadas` : null)
  const trailer = item.videos.find((v) => v.type === "Trailer") ?? item.videos[0]

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0">
        {item.backdrop ? (
          <Image
            src={item.backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        ) : null}
        <div className="from-background via-background/85 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1720px] flex-col justify-end gap-6 px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-16 lg:min-h-[74dvh] xl:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/30 border">
            Destacado hoy
          </Badge>
          <QualityBadge quality={item.quality} />
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {audioFor(item.id)}
          </span>
        </div>

        <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {item.title}
        </h1>

        {item.tagline ? (
          <p className="text-cyan max-w-2xl text-sm font-medium italic sm:text-base">
            {item.tagline}
          </p>
        ) : null}

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="text-foreground inline-flex items-center gap-1.5 font-semibold">
            <Star className="size-4 fill-[var(--warning)] text-[var(--warning)]" />
            {item.rating.toFixed(1)}
            <span className="text-muted-foreground font-normal">
              ({formatVotes(item.votes)})
            </span>
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{item.year ?? "—"}</span>
          {runtime ? (
            <>
              <span aria-hidden>·</span>
              <span>{runtime}</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{typeLabel(item.mediaType)}</span>
          <span aria-hidden>·</span>
          <span>{languageLabel(item.language)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.genres.slice(0, 5).map((genre) => (
            <span
              key={genre.id}
              className="glass rounded-full px-3 py-1 text-xs font-medium"
            >
              {genre.name}
            </span>
          ))}
        </div>

        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed text-pretty sm:text-base">
          {item.overview}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="lg"
            render={<Link href={`/ver/${item.mediaType}/${item.id}`} />}
            nativeButton={false}
            className="shadow-primary/30 h-11 rounded-xl px-6 text-sm shadow-lg"
          >
            <Play data-icon="inline-start" className="fill-current" />
            Ver ahora
          </Button>
          <FavoriteButton
            id={item.id}
            title={item.title}
            className="h-11 rounded-xl px-5"
          />
          <TrailerDialog
            videoKey={trailer?.key ?? null}
            title={item.title}
            className="h-11 rounded-xl px-5"
          />
        </div>
      </div>
    </section>
  )
}

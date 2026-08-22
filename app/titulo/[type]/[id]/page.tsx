import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clapperboard, Globe, Play, Star, Users } from "lucide-react"
import { getDetail } from "@/lib/tmdb"
import { formatDate, formatRuntime, formatVotes, typeLabel } from "@/lib/format"
import { audioFor, languageLabel } from "@/lib/tmdb"
import type { MediaType } from "@/lib/types"
import { AppShell, PageContainer } from "@/components/shell/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FavoriteButton, WatchlistButton } from "@/components/media/library-actions"
import { TrailerDialog } from "@/components/media/trailer-dialog"
import { QualityBadge } from "@/components/media/meta-badges"
import { MediaRow } from "@/components/media/media-row"
import { CastList } from "@/components/detail/cast-list"
import { SeasonBrowser } from "@/components/detail/season-browser"
import { MediaGallery } from "@/components/detail/media-gallery"
import { ReviewsSection } from "@/components/detail/reviews-section"
import { WatchProviders } from "@/components/detail/watch-providers"
import { AddonStreams } from "@/components/detail/addon-streams"

type Params = { type: string; id: string }

function parseType(value: string): MediaType | null {
  return value === "movie" || value === "tv" ? value : null
}

async function loadDetail(params: Params) {
  const type = parseType(params.type)
  const id = Number(params.id)
  if (!type || Number.isNaN(id)) return null
  return getDetail(type, id)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const detail = await loadDetail(await params)
  if (!detail) return { title: "No encontrado" }
  return {
    title: detail.title,
    description: detail.overview || undefined,
  }
}

export default async function TitleDetailPage({ params }: { params: Promise<Params> }) {
  const resolved = await params
  const detail = await loadDetail(resolved)
  if (!detail) notFound()

  const trailer = detail.videos.find((v) => v.type === "Trailer") ?? detail.videos[0]
  const runtime =
    formatRuntime(detail.runtime) ??
    (detail.seasonsCount ? `${detail.seasonsCount} temporadas` : null)

  const infoRows = [
    { label: "Estado", value: detail.status },
    { label: "Idioma original", value: languageLabel(detail.language) },
    detail.countries.length ? { label: "Países", value: detail.countries.join(", ") } : null,
    detail.spokenLanguages.length
      ? { label: "Idiomas disponibles", value: detail.spokenLanguages.join(", ") }
      : null,
    detail.writers.length ? { label: "Guion", value: detail.writers.join(", ") } : null,
    detail.episodesCount ? { label: "Episodios", value: String(detail.episodesCount) } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <AppShell>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {detail.backdrop ? (
            <Image
              src={detail.backdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />
          ) : null}
          <div className="from-background via-background/85 absolute inset-0 bg-gradient-to-r to-transparent" />
          <div className="from-background via-background/50 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-4 pt-24 pb-10 sm:px-6 sm:pt-32 lg:flex-row lg:items-end xl:px-10">
          <div className="ring-border/60 hidden aspect-[2/3] w-52 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-1 lg:block">
            {detail.poster ? (
              <Image
                src={detail.poster}
                alt=""
                width={208}
                height={312}
                className="size-full object-cover"
              />
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/15 text-primary border-primary/30 border">
                {typeLabel(detail.mediaType)}
              </Badge>
              <QualityBadge quality={detail.quality} />
              <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {audioFor(detail.id)}
              </span>
            </div>

            <h1 className="font-display max-w-3xl text-3xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
              {detail.title}
            </h1>

            {detail.tagline ? (
              <p className="text-cyan max-w-2xl text-sm font-medium italic sm:text-base">
                {detail.tagline}
              </p>
            ) : null}

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="text-foreground inline-flex items-center gap-1.5 font-semibold">
                <Star className="size-4 fill-[var(--warning)] text-[var(--warning)]" />
                {detail.rating.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  ({formatVotes(detail.votes)})
                </span>
              </span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{detail.year ?? "—"}</span>
              {runtime ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{runtime}</span>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {detail.genres.map((genre) => (
                <span key={genre.id} className="glass rounded-full px-3 py-1 text-xs font-medium">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed text-pretty sm:text-base">
              {detail.overview || "Sin sinopsis disponible."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                render={<Link href={`/ver/${detail.mediaType}/${detail.id}`} />}
                nativeButton={false}
                className="shadow-primary/30 h-11 rounded-xl px-6 text-sm shadow-lg"
              >
                <Play data-icon="inline-start" className="fill-current" />
                Ver ahora
              </Button>
              <FavoriteButton
                id={detail.id}
                mediaType={detail.mediaType}
                title={detail.title}
                className="h-11 rounded-xl px-5"
              />
              <WatchlistButton
                id={detail.id}
                mediaType={detail.mediaType}
                title={detail.title}
                className="h-11 rounded-xl px-5"
              />
              <TrailerDialog
                videoKey={trailer?.key ?? null}
                title={detail.title}
                className="h-11 rounded-xl px-5"
              />
            </div>
          </div>
        </div>
      </section>

      <PageContainer className="gap-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-12">
            <CastList title="Reparto" people={detail.cast} />
            {detail.directors.length ? (
              <CastList title="Dirección" people={detail.directors} />
            ) : null}

            {detail.mediaType === "tv" && detail.seasons.length ? (
              <SeasonBrowser seriesId={detail.id} seasons={detail.seasons} />
            ) : null}

            <MediaGallery title={detail.title} images={detail.gallery} />
            <ReviewsSection reviews={detail.reviews} />
          </div>

          <aside className="flex flex-col gap-6">
            <AddonStreams mediaType={detail.mediaType} id={detail.id} title={detail.title} />
            <WatchProviders providers={detail.providers} link={detail.providersLink} />

            <div className="glass flex flex-col gap-4 rounded-2xl p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clapperboard className="text-primary size-4" />
                Ficha técnica
              </h2>
              <Separator />
              <dl className="flex flex-col gap-3 text-sm">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                      {row.label}
                    </dt>
                    <dd className="font-medium text-pretty">{row.value}</dd>
                  </div>
                ))}
                {detail.date ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="text-muted-foreground size-3.5" />
                    <span>{formatDate(detail.date)}</span>
                  </div>
                ) : null}
                {detail.votes ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="text-muted-foreground size-3.5" />
                    <span>{formatVotes(detail.votes)} valoraciones</span>
                  </div>
                ) : null}
                {detail.subtitleLanguages.length ? (
                  <div className="flex items-start gap-2 text-xs">
                    <Globe className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                    <span>{detail.subtitleLanguages.slice(0, 8).join(", ")}</span>
                  </div>
                ) : null}
              </dl>
            </div>

            {detail.companies.length ? (
              <div className="glass flex flex-col gap-4 rounded-2xl p-5">
                <h2 className="text-sm font-semibold">Producción</h2>
                <div className="flex flex-wrap items-center gap-3">
                  {detail.companies.map((company) =>
                    company.logo ? (
                      <div
                        key={company.id}
                        className="relative h-8 w-20 shrink-0 rounded bg-white/90 p-1"
                        title={company.name}
                      >
                        <Image src={company.logo} alt={company.name} fill className="object-contain p-1" />
                      </div>
                    ) : (
                      <span key={company.id} className="text-muted-foreground text-xs">
                        {company.name}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {detail.similar.length ? (
          <MediaRow title="Títulos similares" items={detail.similar} />
        ) : null}
      </PageContainer>
    </AppShell>
  )
}

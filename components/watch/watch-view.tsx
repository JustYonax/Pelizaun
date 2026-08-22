"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, PlugZap, Radio } from "lucide-react"
import type { MediaDetail, StreamOption } from "@/lib/types"
import { formatRuntime, typeLabel } from "@/lib/format"
import { ADDONS, STATUS_STYLES } from "@/lib/addons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FavoriteButton, WatchlistButton } from "@/components/media/library-actions"
import { EpisodePicker } from "@/components/watch/episode-picker"
import { readCustomAddons } from "@/lib/addon-protocol"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ streams: StreamOption[]; warning?: string | null }>)

export function WatchView({ item }: { item: MediaDetail }) {
  const [season, setSeason] = useState(
    item.seasons.find((s) => s.seasonNumber === 1)?.seasonNumber ?? item.seasons[0]?.seasonNumber ?? 1,
  )
  const [episode, setEpisode] = useState<number | null>(item.mediaType === "tv" ? 1 : null)
  const [addonUrls, setAddonUrls] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setAddonUrls(
      readCustomAddons().filter((addon) => addon.enabled && addon.capabilities.includes("streams"))
        .map((addon) => addon.manifestUrl),
    )
    sync()
    window.addEventListener("pelizaun:addons-changed", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("pelizaun:addons-changed", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const sources = ADDONS.filter((a) => a.category === "reproduccion")
  const query = new URLSearchParams({
    type: item.mediaType,
    id: String(item.id),
  })

  if (item.mediaType === "tv" && episode) {
    query.set("season", String(season))
    query.set("episode", String(episode))
  }
  addonUrls.forEach((url) => query.append("addon", url))

  const { data: streamsData } = useSWR(`/api/streams?${query.toString()}`, fetcher)
  const streams = streamsData?.streams ?? []
  const streamWarning = streamsData?.warning ?? null
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedStreamId((current) => {
      if (!streams.length) return null
      if (current && streams.some((stream) => stream.id === current)) return current
      return streams[0]?.id ?? null
    })
  }, [streams])

  const selectedStream =
    streams.find((stream) => stream.id === selectedStreamId) ?? (streams[0] ? streams[0] : null)
  const isEmbedStream = selectedStream?.url.includes("youtube-nocookie.com/embed/")

  const subtitle =
    item.mediaType === "tv" && episode
      ? `Temporada ${season} · Episodio ${episode}`
      : (formatRuntime(item.runtime) ?? typeLabel(item.mediaType))

  return (
    <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-4 py-6 sm:px-6 xl:px-10">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/titulo/${item.mediaType}/${item.id}`} />}
        nativeButton={false}
        className="text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft data-icon="inline-start" />
        Volver a la ficha
      </Button>

      <div
        className={cn(
          "grid gap-6",
          item.mediaType === "tv" && item.seasons.length ? "lg:grid-cols-[1fr_360px]" : "",
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="ring-border/60 relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1">
            {selectedStream ? (
              <>
                {isEmbedStream ? (
                  <iframe
                    src={selectedStream.url}
                    title={`Reproduciendo ${selectedStream.label}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="size-full border-0"
                  />
                ) : (
                  <video
                    key={selectedStream.url}
                    src={selectedStream.url}
                    controls
                    playsInline
                    className="size-full"
                  />
                )}
                <span className="glass pointer-events-none absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-semibold">
                  {selectedStream.provider} · {selectedStream.quality}
                </span>
              </>
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Radio className="size-8" />
                <p className="max-w-xs text-sm">
                  No hay una fuente disponible. Instala un addon compatible en Addons y APIs.
                </p>
              </div>
            )}
          </div>

          <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="truncate text-lg font-semibold">{item.title}</h1>
              <p className="text-muted-foreground text-xs">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FavoriteButton
                id={item.id}
                mediaType={item.mediaType}
                title={item.title}
                size="sm"
                className="rounded-lg"
              />
              <WatchlistButton
                id={item.id}
                mediaType={item.mediaType}
                title={item.title}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="glass flex flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <PlugZap className="text-primary size-4" />
              Fuentes de reproducción
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Las fuentes se obtienen de tus addons activos. Solo se aceptan streams HTTPS
              directos; los trailers se mantienen separados de la reproducción.
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => {
                const style = STATUS_STYLES[source.status]
                return (
                  <span
                    key={source.id}
                    className="border-border/60 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  >
                    <span className={cn("size-1.5 rounded-full", style.dot)} />
                    {source.name}
                  </span>
                )
              })}
            </div>
            {streams.length ? (
              <div className="flex flex-col gap-2">
                {streams.map((stream) => (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => setSelectedStreamId(stream.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      selectedStream?.id === stream.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 hover:bg-accent/50",
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold">{stream.provider}</span>
                      <span className="text-muted-foreground text-xs">
                        {stream.isSubscription ? "Subscription" : "Free"} · {stream.quality}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs font-medium">{stream.label}</span>
                      <span className="text-muted-foreground truncate text-[11px]">
                        {[stream.details, stream.language?.toUpperCase(), stream.source]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No hay streams disponibles para esta selección.
              </p>
            )}
            {streamWarning ? (
              <p className="text-[var(--warning)] text-xs leading-relaxed">{streamWarning}</p>
            ) : null}
          </div>

          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed text-pretty">
            {item.overview}
          </p>
        </div>

        {item.mediaType === "tv" && item.seasons.length ? (
          <EpisodePicker
            seriesId={item.id}
            seasons={item.seasons}
            season={season}
            episode={episode}
            onSeasonChange={(next) => {
              setSeason(next)
              setEpisode(1)
            }}
            onEpisodeChange={setEpisode}
          />
        ) : null}
      </div>
    </div>
  )
}

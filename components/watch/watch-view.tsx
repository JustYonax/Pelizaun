"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, PlugZap } from "lucide-react"
import type { MediaDetail, StreamOption } from "@/lib/types"
import { formatRuntime, typeLabel } from "@/lib/format"
import { ADDONS, STATUS_STYLES } from "@/lib/addons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FavoriteButton, WatchlistButton } from "@/components/media/library-actions"
import { EpisodePicker } from "@/components/watch/episode-picker"
import { Player } from "@/components/player/Player"
import { Spinner } from "@/components/ui/spinner"
import { addonProvides, readCustomAddons } from "@/lib/addon-protocol"

const fetcher = (url: string) =>
  fetch(url).then((response) => response.json() as Promise<{ streams: StreamOption[]; warning?: string | null }>)

export function WatchView({ item }: { item: MediaDetail }) {
  const searchParams = useSearchParams()
  const requestedSource = searchParams.get("source")
  const [season, setSeason] = useState(
    item.seasons.find((entry) => entry.seasonNumber === 1)?.seasonNumber ?? item.seasons[0]?.seasonNumber ?? 1,
  )
  const [episode, setEpisode] = useState<number | null>(item.mediaType === "tv" ? 1 : null)
  const [addonUrls, setAddonUrls] = useState<string[]>([])

  useEffect(() => {
    const sync = () =>
      setAddonUrls(
        readCustomAddons()
          .filter((addon) => addonProvides(addon, "streams"))
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

  const sources = ADDONS.filter((addon) => addon.category === "reproduccion")
  const query = new URLSearchParams({
    type: item.mediaType,
    id: String(item.id),
  })

  if (item.mediaType === "tv" && episode) {
    query.set("season", String(season))
    query.set("episode", String(episode))
  }
  addonUrls.forEach((url) => query.append("addon", url))

  const { data: streamsData, isLoading } = useSWR(
    addonUrls.length ? `/api/streams?${query.toString()}` : null,
    fetcher,
  )
  const streams = streamsData?.streams ?? []
  const streamWarning = streamsData?.warning ?? null
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(requestedSource)

  useEffect(() => {
    setSelectedStreamId((current) => {
      if (!streams.length) return null
      if (requestedSource && streams.some((stream) => stream.id === requestedSource && stream.playable !== false)) {
        return requestedSource
      }
      if (current && streams.some((stream) => stream.id === current)) return current
      return streams.find((stream) => stream.playable !== false)?.id ?? streams[0]?.id ?? null
    })
  }, [streams, requestedSource])

  const selectedStream =
    streams.find((stream) => stream.id === selectedStreamId) ?? streams.find((stream) => stream.playable !== false) ?? null

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
          <Player stream={selectedStream} title={item.title} />

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
              Las fuentes se obtienen de tus addons activos, en el orden de prioridad de
              Addons y APIs. Solo se reproducen streams HTTPS directos (incluido Debrid).
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
            {isLoading ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <Spinner />
                Consultando addons…
              </p>
            ) : null}
            {streams.length ? (
              <div className="flex flex-col gap-2">
                {streams.map((stream) => (
                  <button
                    key={stream.id}
                    type="button"
                    onClick={() => {
                      if (stream.playable === false) return
                      setSelectedStreamId(stream.id)
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      selectedStream?.id === stream.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 hover:bg-accent/50",
                      stream.playable === false ? "cursor-not-allowed opacity-60" : "",
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold">{stream.provider}</span>
                      <span className="text-muted-foreground text-xs">
                        {stream.isSubscription ? "Subscription" : "Free"} · {stream.quality}
                        {stream.size ? ` · ${stream.size}` : ""}
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
            ) : !isLoading ? (
              <p className="text-muted-foreground text-xs">
                No hay streams disponibles para esta selección.
              </p>
            ) : null}
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

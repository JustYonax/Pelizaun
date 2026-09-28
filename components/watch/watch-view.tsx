"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import type { MediaDetail, StreamOption } from "@/lib/types"
import { formatRuntime, typeLabel } from "@/lib/format"
import { FavoriteButton, WatchlistButton } from "@/components/media/library-actions"
import { EpisodePicker } from "@/components/watch/episode-picker"
import { PlayerPlaceholder } from "@/components/player/player-placeholder"
import { addonProvides, readCustomAddons } from "@/lib/addon-protocol"

const TheaterPlayer = dynamic(
  () => import("@/components/player/theater-player").then((mod) => ({ default: mod.TheaterPlayer })),
  { ssr: false, loading: () => <PlayerPlaceholder message="Cargando reproductor…" /> },
)

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
    <div className="flex w-full flex-col">
      <TheaterPlayer
        title={item.title}
        subtitle={subtitle}
        backHref={`/titulo/${item.mediaType}/${item.id}`}
        stream={selectedStream}
        streams={streams}
        streamsLoading={isLoading}
        onSelectStream={setSelectedStreamId}
        warning={streamWarning}
        episodePanel={
          item.mediaType === "tv" && item.seasons.length ? (
            <EpisodePicker
              seriesId={item.id}
              seasons={item.seasons}
              season={season}
              episode={episode}
              variant="overlay"
              onSeasonChange={(next) => {
                setSeason(next)
                setEpisode(1)
              }}
              onEpisodeChange={setEpisode}
            />
          ) : null
        }
      />

      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-4 py-5 sm:px-6 xl:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{item.title}</h1>
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
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed text-pretty">{item.overview}</p>
      </div>
    </div>
  )
}

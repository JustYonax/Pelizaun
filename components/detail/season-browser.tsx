"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Film, Loader2, Star } from "lucide-react"
import type { Episode, SeasonSummary } from "@/lib/types"
import { formatDate, formatRuntime } from "@/lib/format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ episodes: Episode[] }>)

export function SeasonBrowser({
  seriesId,
  seasons,
}: {
  seriesId: number
  seasons: SeasonSummary[]
}) {
  const [seasonNumber, setSeasonNumber] = useState(
    seasons.find((s) => s.seasonNumber === 1)?.seasonNumber ?? seasons[0]?.seasonNumber ?? 1,
  )

  const { data, isLoading } = useSWR(
    `/api/temporada?id=${seriesId}&season=${seasonNumber}`,
    fetcher,
  )

  if (!seasons.length) return null

  const episodes = data?.episodes ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold sm:text-xl">Episodios</h2>
        <Select
          value={String(seasonNumber)}
          onValueChange={(value) => setSeasonNumber(Number(value))}
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {() => seasons.find((s) => s.seasonNumber === seasonNumber)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasons.map((season) => (
              <SelectItem key={season.id} value={String(season.seasonNumber)}>
                {season.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando episodios…
        </div>
      ) : episodes.length ? (
        <ul className="flex flex-col gap-3">
          {episodes.map((episode) => (
            <li
              key={episode.id}
              className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-start"
            >
              <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-56">
                {episode.still ? (
                  <Image
                    src={episode.still}
                    alt=""
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <Film className="size-6" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-primary text-xs font-semibold tabular-nums">
                    {episode.number}.
                  </span>
                  <h3 className="truncate text-sm font-semibold">{episode.name}</h3>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                  {episode.airDate ? <span>{formatDate(episode.airDate)}</span> : null}
                  {episode.runtime ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{formatRuntime(episode.runtime)}</span>
                    </>
                  ) : null}
                  {episode.rating ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-[var(--warning)] text-[var(--warning)]" />
                        {episode.rating.toFixed(1)}
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                  {episode.overview || "Sin sinopsis disponible."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Sin episodios disponibles para esta temporada.
        </p>
      )}
    </div>
  )
}

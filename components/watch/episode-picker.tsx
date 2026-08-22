"use client"

import Image from "next/image"
import useSWR from "swr"
import { Check, Film, Loader2, Play } from "lucide-react"
import type { Episode, SeasonSummary } from "@/lib/types"
import { formatRuntime } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ episodes: Episode[] }>)

type Props = {
  seriesId: number
  seasons: SeasonSummary[]
  season: number
  episode: number | null
  onSeasonChange: (season: number) => void
  onEpisodeChange: (episode: number) => void
}

export function EpisodePicker({
  seriesId,
  seasons,
  season,
  episode,
  onSeasonChange,
  onEpisodeChange,
}: Props) {
  const { data, isLoading } = useSWR(
    `/api/temporada?id=${seriesId}&season=${season}`,
    fetcher,
  )

  const episodes = data?.episodes ?? []

  return (
    <div className="glass flex max-h-[560px] flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Episodios</h2>
        <Select value={String(season)} onValueChange={(v) => onSeasonChange(Number(v))}>
          <SelectTrigger className="w-40" size="sm">
            <SelectValue>{() => seasons.find((s) => s.seasonNumber === season)?.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={String(s.seasonNumber)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="scrollbar-none flex flex-col gap-1.5 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando episodios…
          </div>
        ) : episodes.length ? (
          episodes.map((ep) => {
            const active = ep.number === episode
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => onEpisodeChange(ep.number)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-2 text-left transition-colors",
                  active ? "bg-primary/15 ring-primary/40 ring-1" : "hover:bg-accent/50",
                )}
              >
                <div className="bg-muted relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg">
                  {ep.still ? (
                    <Image src={ep.still} alt="" fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                      <Film className="size-4" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity",
                      !active && "hover:opacity-100",
                    )}
                  >
                    {active ? (
                      <Check className="size-4 fill-current" />
                    ) : (
                      <Play className="size-4 fill-current" />
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-xs font-semibold">
                    {ep.number}. {ep.name}
                  </p>
                  <p className="text-muted-foreground text-[10px]">
                    {formatRuntime(ep.runtime) ?? "—"}
                  </p>
                </div>
              </button>
            )
          })
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Sin episodios disponibles.
          </p>
        )}
      </div>
    </div>
  )
}

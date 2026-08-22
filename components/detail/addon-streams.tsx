"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { PlugZap } from "lucide-react"
import type { MediaType, StreamOption } from "@/lib/types"
import { addonProvides, readCustomAddons } from "@/lib/addon-protocol"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const fetcher = (url: string) =>
  fetch(url).then((response) => response.json() as Promise<{ streams: StreamOption[]; warning?: string | null }>)

export function AddonStreams({
  mediaType,
  id,
  title,
}: {
  mediaType: MediaType
  id: number
  title: string
}) {
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

  const query = new URLSearchParams({ type: mediaType, id: String(id) })
  addonUrls.forEach((url) => query.append("addon", url))
  const { data, isLoading } = useSWR(addonUrls.length ? `/api/streams?${query}` : null, fetcher)
  const streams = data?.streams ?? []

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <PlugZap className="text-primary size-4" />
        Fuentes de addons
      </h2>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Orígenes disponibles para {title}. Elige una fuente para abrir el reproductor.
      </p>
      {!addonUrls.length ? (
        <p className="text-muted-foreground text-xs">
          No hay addons de reproducción activos. Instálalos en Addons y APIs.
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Spinner />
          Consultando addons…
        </p>
      ) : null}
      {streams.length ? (
        <div className="flex flex-col gap-2">
          {streams.map((stream) => {
            const playable = stream.playable !== false
            const href = `/ver/${mediaType}/${id}?source=${encodeURIComponent(stream.id)}`
            const body = (
              <>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">{stream.provider}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {stream.quality}
                    {stream.size ? ` · ${stream.size}` : ""}
                    {stream.language ? ` · ${stream.language.toUpperCase()}` : ""}
                  </span>
                </span>
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{stream.label}</span>
              </>
            )
            if (!playable) {
              return (
                <div
                  key={stream.id}
                  className="border-border/60 flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 opacity-60"
                >
                  {body}
                </div>
              )
            }
            return (
              <Button
                key={stream.id}
                variant="outline"
                nativeButton={false}
                render={<Link href={href} />}
                className="h-auto w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left whitespace-normal"
              >
                {body}
              </Button>
            )
          })}
        </div>
      ) : addonUrls.length && !isLoading ? (
        <p className="text-muted-foreground text-xs">{data?.warning ?? "Ningún addon devolvió fuentes."}</p>
      ) : null}
      {data?.warning && streams.length ? (
        <p className="text-[var(--warning)] text-xs">{data.warning}</p>
      ) : null}
    </div>
  )
}

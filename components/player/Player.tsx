"use client"

import { Radio } from "lucide-react"
import type { StreamOption } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Player({
  stream,
  title,
  emptyMessage = "No hay una fuente disponible. Instala un addon compatible en Addons y APIs.",
}: {
  stream: StreamOption | null
  title: string
  emptyMessage?: string
}) {
  const playable = Boolean(stream?.playable !== false && stream?.url)
  const isEmbed = stream?.kind === "embed" || Boolean(stream?.url.includes("youtube-nocookie.com/embed/"))

  return (
    <div className="ring-border/60 relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1">
      {playable && stream ? (
        <>
          {isEmbed ? (
            <iframe
              src={stream.url}
              title={`Reproduciendo ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full border-0"
            />
          ) : (
            <video
              key={stream.url}
              src={stream.url}
              controls
              playsInline
              className="size-full"
            />
          )}
          <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-col gap-1">
            <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold">
              {stream.provider} · {stream.quality}
              {stream.size ? ` · ${stream.size}` : ""}
            </span>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <Radio className={cn("size-8")} />
          <p className="max-w-xs text-sm">{stream?.details || emptyMessage}</p>
        </div>
      )}
    </div>
  )
}

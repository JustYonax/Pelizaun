"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Radio, Search } from "lucide-react"
import type { LiveChannel } from "@/lib/addon-protocol"
import { readCustomAddons } from "@/lib/addon-protocol"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((response) => response.json() as Promise<{ channels: LiveChannel[]; warning?: string | null }>)

export function LiveTv() {
  const [addonUrls, setAddonUrls] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  useEffect(() => {
    const sync = () => setAddonUrls(readCustomAddons().filter((addon) => addon.enabled && addon.capabilities.includes("live")).map((addon) => addon.manifestUrl))
    sync(); window.addEventListener("pelizaun:addons-changed", sync); window.addEventListener("storage", sync)
    return () => { window.removeEventListener("pelizaun:addons-changed", sync); window.removeEventListener("storage", sync) }
  }, [])
  const params = new URLSearchParams(); addonUrls.forEach((url) => params.append("addon", url))
  const { data, isLoading } = useSWR(addonUrls.length ? `/api/live?${params}` : null, fetcher)
  const channels = data?.channels ?? []
  const filtered = useMemo(() => channels.filter((channel) => `${channel.name} ${channel.category} ${channel.country ?? ""}`.toLowerCase().includes(query.toLowerCase())), [channels, query])
  const selected = channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div className="flex flex-col gap-4">
      <div className="ring-border/60 relative aspect-video overflow-hidden rounded-2xl bg-black ring-1">
        {selected ? <video key={selected.url} src={selected.url} controls autoPlay playsInline className="size-full" /> :
          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-3 text-center"><Radio className="size-9" /><p className="max-w-sm text-sm">Instala y activa un addon con canales autorizados para comenzar.</p></div>}
      </div>
      {selected ? <div className="glass flex items-center gap-3 rounded-2xl p-4"><span className="bg-destructive size-2 animate-pulse rounded-full" /><div><h2 className="font-semibold">{selected.name}</h2><p className="text-muted-foreground text-xs">En vivo · {selected.addon}</p></div></div> : null}
    </div>
    <aside className="glass flex max-h-[720px] flex-col gap-3 rounded-2xl p-4">
      <div className="relative"><Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal…" className="h-10 pl-9" /></div>
      <div className="scrollbar-none flex flex-col gap-2 overflow-y-auto">
        {isLoading ? <p className="text-muted-foreground p-4 text-center text-sm">Cargando canales…</p> : null}
        {filtered.map((channel) => <button key={channel.id} type="button" onClick={() => setSelectedId(channel.id)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", selected?.id === channel.id ? "border-primary/60 bg-primary/10" : "border-border/60 hover:bg-accent/50")}>
          <div className="bg-muted relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg">{channel.logo ? <Image src={channel.logo} alt="" fill sizes="44px" className="object-contain p-1" /> : <Radio className="size-4" />}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{channel.name}</p><p className="text-muted-foreground truncate text-[11px]">{channel.category} · {channel.country ?? channel.language ?? channel.addon}</p></div>
        </button>)}
        {!isLoading && addonUrls.length > 0 && !filtered.length ? <p className="text-muted-foreground p-4 text-center text-sm">No se encontraron canales.</p> : null}
      </div>{data?.warning ? <p className="text-[var(--warning)] text-xs">{data.warning}</p> : null}
    </aside>
  </div>
}

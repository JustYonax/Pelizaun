"use client"

import { useEffect, useState } from "react"
import { Activity, KeyRound, Plus, Radio, ShieldCheck, Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  ADDON_CATEGORIES,
  ADDONS,
  STATUS_STYLES,
  type Addon,
  type AddonCategory,
} from "@/lib/addons"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  readCustomAddons,
  writeCustomAddons,
  type CustomAddon,
  type PelizaunManifest,
} from "@/lib/addon-protocol"

const CATEGORY_ORDER: AddonCategory[] = [
  "catalogo",
  "metadatos",
  "reproduccion",
  "subtitulos",
  "recomendacion",
  "sincronizacion",
]

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="glass flex flex-col gap-1 rounded-2xl p-4">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase">
        {label}
      </p>
      <p className={cn("font-display text-2xl font-semibold tabular-nums", tone)}>{value}</p>
    </div>
  )
}

function AddonCard({ addon, onToggle }: { addon: Addon; onToggle: (id: string) => void }) {
  const style = STATUS_STYLES[addon.status]

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{addon.name}</h3>
            {addon.official ? (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <ShieldCheck className="size-3" />
                Oficial
              </Badge>
            ) : null}
            {addon.requiresKey ? (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <KeyRound className="size-3" />
                API key
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">{addon.description}</p>
        </div>
        <Switch
          checked={addon.enabled}
          onCheckedChange={() => onToggle(addon.id)}
          aria-label={`${addon.enabled ? "Desactivar" : "Activar"} ${addon.name}`}
        />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          <span className={style.text}>{style.label}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Timer className="size-3" />
          {addon.latency > 0 ? `${addon.latency} ms` : "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Activity className="size-3" />
          {addon.uptime > 0 ? `${addon.uptime.toFixed(1)}% uptime` : "—"}
        </span>
        <span className="tabular-nums">
          {addon.requests24h.toLocaleString("es-ES")} peticiones/24h
        </span>
        <span className="ml-auto font-mono text-[10px]">v{addon.version}</span>
      </div>
    </div>
  )
}

export function AddonsBoard() {
  const [addons, setAddons] = useState(ADDONS)
  const [customAddons, setCustomAddons] = useState<CustomAddon[]>([])
  const [manifestUrl, setManifestUrl] = useState("")
  const [installing, setInstalling] = useState(false)

  useEffect(() => setCustomAddons(readCustomAddons()), [])

  const persistCustom = (next: CustomAddon[]) => {
    setCustomAddons(next)
    writeCustomAddons(next)
  }

  const install = async () => {
    if (!manifestUrl.trim()) return
    setInstalling(true)
    try {
      const response = await fetch("/api/addons/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: manifestUrl.trim() }),
      })
      const result = await response.json() as {
        manifest?: PelizaunManifest
        manifestUrl?: string
        error?: string
      }
      if (!response.ok || !result.manifest || !result.manifestUrl) {
        throw new Error(result.error ?? "No se pudo validar el addon")
      }
      const addon: CustomAddon = {
        id: result.manifest.id,
        name: result.manifest.name,
        description: result.manifest.description ?? "Addon personalizado",
        version: result.manifest.version,
        manifestUrl: result.manifestUrl,
        capabilities: result.manifest.capabilities,
        enabled: true,
      }
      persistCustom([addon, ...customAddons.filter((item) => item.id !== addon.id)])
      setManifestUrl("")
      toast.success("Addon instalado", { description: addon.name })
    } catch (error) {
      toast.error("No se pudo instalar", { description: (error as Error).message })
    } finally {
      setInstalling(false)
    }
  }

  const toggle = (id: string) => {
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const next = !a.enabled
        toast(next ? "Addon activado" : "Addon desactivado", { description: a.name })
        return { ...a, enabled: next }
      }),
    )
  }

  const operativo = addons.filter((a) => a.status === "operativo").length
  const degradado = addons.filter((a) => a.status === "degradado").length
  const caido = addons.filter((a) => a.status === "caido").length

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Addons totales" value={addons.length + customAddons.length} />
        <StatCard label="Operativos" value={operativo} tone="text-[var(--success)]" />
        <StatCard label="Degradados" value={degradado} tone="text-[var(--warning)]" />
        <StatCard label="Caídos" value={caido} tone="text-destructive" />
      </div>

      <section className="glass flex flex-col gap-4 rounded-2xl p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Instalar addon</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Pega un manifest PelisZaun HTTPS. Puede aportar streams directos, canales en vivo o ambos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={manifestUrl}
            onChange={(event) => setManifestUrl(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void install() }}
            placeholder="https://proveedor.example/manifest.json"
            className="h-10 flex-1"
          />
          <Button onClick={() => void install()} disabled={installing || !manifestUrl.trim()} className="h-10">
            <Plus data-icon="inline-start" />
            {installing ? "Validando…" : "Instalar"}
          </Button>
        </div>
        <p className="text-muted-foreground text-[11px]">
          Se rechazan torrents, magnets, direcciones privadas y respuestas que no sean streams HTTPS directos.
        </p>
      </section>

      {customAddons.length ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold sm:text-xl">Mis addons</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {customAddons.map((addon) => (
              <div key={addon.id} className="glass flex flex-col gap-4 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{addon.name}</h3>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{addon.description}</p>
                  </div>
                  <Switch
                    checked={addon.enabled}
                    onCheckedChange={() => persistCustom(customAddons.map((item) =>
                      item.id === addon.id ? { ...item, enabled: !item.enabled } : item))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {addon.capabilities.includes("streams") ? <Badge variant="secondary">Películas y series</Badge> : null}
                  {addon.capabilities.includes("live") ? <Badge variant="secondary"><Radio /> TV en vivo</Badge> : null}
                  <span className="text-muted-foreground ml-auto text-[10px]">v{addon.version}</span>
                  <Button
                    variant="ghost" size="icon-sm" aria-label={`Eliminar ${addon.name}`}
                    onClick={() => persistCustom(customAddons.filter((item) => item.id !== addon.id))}
                  ><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {CATEGORY_ORDER.map((category) => {
        const items = addons.filter((a) => a.category === category)
        if (!items.length) return null
        return (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold sm:text-xl">
              {ADDON_CATEGORIES[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((addon) => (
                <AddonCard key={addon.id} addon={addon} onToggle={toggle} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

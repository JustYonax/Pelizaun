"use client"

import { Activity, KeyRound, RefreshCw, ShieldCheck, Timer } from "lucide-react"
import { toast } from "sonner"
import {
  ADDON_CATEGORIES,
  ADDONS,
  STATUS_STYLES,
  type Addon,
  type AddonCategory,
} from "@/lib/addons"
import { useAddons } from "@/lib/hooks/useAddons"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddonCard } from "@/components/addons/AddonCard"
import { AddonForm } from "@/components/addons/AddonForm"
import { useState } from "react"

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

function OfficialAddonCard({ addon, onToggle }: { addon: Addon; onToggle: (id: string) => void }) {
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
  const [officialAddons, setOfficialAddons] = useState(ADDONS)
  const [manifestUrl, setManifestUrl] = useState("")
  const {
    addons,
    installing,
    checkingUpdates,
    updates,
    installAddon,
    removeAddon,
    toggleAddon,
    reorderAddon,
    saveConfig,
    updateAddon,
    checkUpdates,
  } = useAddons()

  const install = async () => {
    if (!manifestUrl.trim()) return
    try {
      const addon = await installAddon(manifestUrl.trim())
      setManifestUrl("")
      toast.success("Addon instalado", { description: addon.name })
    } catch (error) {
      toast.error("No se pudo instalar", { description: (error as Error).message })
    }
  }

  const toggleOfficial = (id: string) => {
    setOfficialAddons((prev) =>
      prev.map((addon) => {
        if (addon.id !== id) return addon
        const next = !addon.enabled
        toast(next ? "Addon activado" : "Addon desactivado", { description: addon.name })
        return { ...addon, enabled: next }
      }),
    )
  }

  const operativo = officialAddons.filter((addon) => addon.status === "operativo").length
  const degradado = officialAddons.filter((addon) => addon.status === "degradado").length
  const caido = officialAddons.filter((addon) => addon.status === "caido").length

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Addons totales" value={officialAddons.length + addons.length} />
        <StatCard label="Operativos" value={operativo} tone="text-[var(--success)]" />
        <StatCard label="Degradados" value={degradado} tone="text-[var(--warning)]" />
        <StatCard label="Caídos" value={caido} tone="text-destructive" />
      </div>

      <section className="glass flex flex-col gap-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Instalar addon</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Pega un manifest HTTPS de Pelizaun o Stremio. Puede aportar streams HTTPS
              directos, canales en vivo o ambos.
            </p>
          </div>
          <AddonForm
            onInstall={async (url) => {
              const addon = await installAddon(url)
              toast.success("Addon instalado", { description: addon.name })
            }}
            isLoading={installing}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={manifestUrl}
            onChange={(event) => setManifestUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void install()
            }}
            placeholder="https://proveedor.example/manifest.json"
            className="h-10 flex-1"
          />
          <Button onClick={() => void install()} disabled={installing || !manifestUrl.trim()} className="h-10">
            {installing ? "Validando…" : "Instalar"}
          </Button>
        </div>
        <p className="text-muted-foreground text-[11px]">
          Se aceptan streams HTTPS (incluido Debrid). Los magnets y torrents se listan
          como no reproducibles en el navegador.
        </p>
      </section>

      {addons.length ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold sm:text-xl">Mis addons</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                El orden es la prioridad: el primero se consulta primero al buscar fuentes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={checkingUpdates}
              onClick={async () => {
                try {
                  const found = await checkUpdates()
                  const count = Object.keys(found).length
                  toast(
                    count ? `${count} actualización${count === 1 ? "" : "es"} disponible${count === 1 ? "" : "s"}` : "Todo está al día",
                  )
                } catch (error) {
                  toast.error("No se pudieron comprobar actualizaciones", {
                    description: (error as Error).message,
                  })
                }
              }}
            >
              <RefreshCw data-icon="inline-start" className={checkingUpdates ? "animate-spin" : undefined} />
              {checkingUpdates ? "Comprobando…" : "Buscar actualizaciones"}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {addons.map((addon, index) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isFirst={index === 0}
                isLast={index === addons.length - 1}
                updateVersion={updates[addon.id]}
                onToggle={toggleAddon}
                onRemove={removeAddon}
                onMove={reorderAddon}
                onUpdate={async (id) => {
                  const updated = await updateAddon(id)
                  toast.success("Addon actualizado", { description: `${updated.name} v${updated.version}` })
                }}
                onSaveConfig={async (id, config) => {
                  await saveConfig(id, config)
                  toast.success("Configuración guardada")
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {CATEGORY_ORDER.map((category) => {
        const items = officialAddons.filter((addon) => addon.category === category)
        if (!items.length) return null
        return (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold sm:text-xl">
              {ADDON_CATEGORIES[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((addon) => (
                <OfficialAddonCard key={addon.id} addon={addon} onToggle={toggleOfficial} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

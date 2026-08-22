"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Radio, Settings2, Trash2, Upload } from "lucide-react"
import type { CustomAddon } from "@/lib/addon-protocol"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { AddonConfigForm } from "@/components/addons/AddonConfigForm"

export function AddonCard({
  addon,
  isFirst,
  isLast,
  updateVersion,
  onToggle,
  onRemove,
  onMove,
  onUpdate,
  onSaveConfig,
}: {
  addon: CustomAddon
  isFirst: boolean
  isLast: boolean
  updateVersion?: string
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
  onUpdate: (id: string) => Promise<unknown>
  onSaveConfig: (id: string, config: Record<string, string>) => Promise<unknown>
}) {
  const [configOpen, setConfigOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{addon.name}</h3>
            <Badge variant="outline" className="text-[10px]">
              {addon.protocol === "stremio" ? "Stremio" : "Pelizaun"}
            </Badge>
            {addon.configurationRequired ? (
              <Badge variant="secondary" className="text-[10px]">
                Requiere config
              </Badge>
            ) : null}
            {updateVersion ? (
              <Badge variant="destructive" className="text-[10px]">
                Nueva v{updateVersion}
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{addon.description}</p>
        </div>
        <Switch
          checked={addon.enabled}
          onCheckedChange={() => onToggle(addon.id)}
          aria-label={`${addon.enabled ? "Desactivar" : "Activar"} ${addon.name}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {addon.capabilities.includes("streams") ? (
          <Badge variant="secondary">Películas y series</Badge>
        ) : null}
        {addon.capabilities.includes("live") ? (
          <Badge variant="secondary">
            <Radio />
            TV en vivo
          </Badge>
        ) : null}
        {addon.capabilities.includes("catalog") ? <Badge variant="secondary">Catálogo</Badge> : null}
        <span className="text-muted-foreground ml-auto text-[10px]">v{addon.version}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Subir prioridad de ${addon.name}`}
          disabled={isFirst}
          onClick={() => onMove(addon.id, "up")}
        >
          <ChevronUp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Bajar prioridad de ${addon.name}`}
          disabled={isLast}
          onClick={() => onMove(addon.id, "down")}
        >
          <ChevronDown />
        </Button>
        {addon.configSchema.length ? (
          <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings2 data-icon="inline-start" />
            Configurar
          </Button>
        ) : null}
        {updateVersion ? (
          <Button
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={async () => {
              setUpdating(true)
              try {
                await onUpdate(addon.id)
              } finally {
                setUpdating(false)
              }
            }}
          >
            <Upload data-icon="inline-start" />
            {updating ? "Actualizando…" : "Actualizar"}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive ml-auto"
          aria-label={`Eliminar ${addon.name}`}
          onClick={() => onRemove(addon.id)}
        >
          <Trash2 />
        </Button>
      </div>

      <p className={cn("text-muted-foreground truncate font-mono text-[10px]")} title={addon.manifestUrl}>
        {addon.manifestUrl}
      </p>

      {addon.configSchema.length ? (
        <AddonConfigForm
          open={configOpen}
          onOpenChange={setConfigOpen}
          title={addon.name}
          schema={addon.configSchema}
          values={addon.config}
          onSave={async (config) => {
            await onSaveConfig(addon.id, config)
          }}
        />
      ) : null}
    </div>
  )
}

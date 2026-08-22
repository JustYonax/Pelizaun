"use client"

import { useEffect, useState } from "react"
import type { StremioConfigField } from "@/lib/stremio"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function ConfigFieldControl({
  field,
  value,
  onChange,
}: {
  field: StremioConfigField
  value: string
  onChange: (value: string) => void
}) {
  switch (field.type) {
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(event) => onChange(event.target.checked ? "true" : "false")}
            className="border-input size-4 rounded"
          />
          {field.title}
        </label>
      )
    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field.key}>{field.title}</Label>
          <select
            id={field.key}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
          >
            <option value="">Selecciona una opción</option>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    case "password":
    case "number":
    case "text":
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field.key}>
            {field.title}
            {field.required ? " *" : ""}
          </Label>
          <Input
            id={field.key}
            type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
          />
        </div>
      )
    default: {
      const exhaustive: never = field.type
      throw new Error(`Tipo de campo no soportado: ${exhaustive}`)
    }
  }
}

export function AddonConfigForm({
  open,
  onOpenChange,
  title,
  schema,
  values,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  schema: StremioConfigField[]
  values: Record<string, string>
  onSave: (config: Record<string, string>) => Promise<void>
}) {
  const [config, setConfig] = useState<Record<string, string>>(values)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setConfig(values)
      setError("")
    }
  }, [open, values])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSave(config)
      onOpenChange(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar {title}</DialogTitle>
          <DialogDescription>
            Estos valores se guardan en este navegador y se envían al addon en la
            siguiente consulta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {schema.map((field) => (
            <ConfigFieldControl
              key={field.key}
              field={field}
              value={config[field.key] ?? field.default ?? (field.type === "checkbox" ? "false" : "")}
              onChange={(value) => setConfig((current) => ({ ...current, [field.key]: value }))}
            />
          ))}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

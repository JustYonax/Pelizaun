"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddonFormProps {
  onInstall: (url: string) => Promise<unknown>
  isLoading: boolean
}

export function AddonForm({ onInstall, isLoading }: AddonFormProps) {
  const [url, setUrl] = useState("")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    try {
      await onInstall(url.trim())
      setUrl("")
      setOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al instalar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Agregar addon
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Instalar addon</DialogTitle>
          <DialogDescription>
            Pega la URL HTTPS del manifest (Pelizaun o Stremio). El servidor valida el
            manifiesto para evitar CORS y direcciones privadas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addon-url">URL del manifest</Label>
            <Input
              id="addon-url"
              placeholder="https://ejemplo.com/manifest.json"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={isLoading || !url.trim()}>
            {isLoading ? "Instalando…" : "Instalar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

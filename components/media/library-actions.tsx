"use client"

import useSWR from "swr"
import { Bookmark, Check, Heart, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Estado de biblioteca compartido entre componentes vía SWR.
 * Cuando exista backend, basta con sustituir el fetcher por llamadas reales:
 * la interfaz de los botones no cambia.
 */
type Collection = "favorites" | "watchlist"

const KEY: Record<Collection, string> = {
  favorites: "nebula:favorites",
  watchlist: "nebula:watchlist",
}

function read(collection: Collection): number[] {
  try {
    const stored = window.localStorage.getItem(KEY[collection])
    return stored ? (JSON.parse(stored) as number[]) : []
  } catch {
    return []
  }
}

function useCollection(collection: Collection) {
  const { data = [], mutate } = useSWR<number[]>(
    KEY[collection],
    () => read(collection),
    { revalidateOnFocus: false, fallbackData: [] },
  )

  const toggle = (id: number) => {
    const next = data.includes(id) ? data.filter((x) => x !== id) : [...data, id]
    try {
      window.localStorage.setItem(KEY[collection], JSON.stringify(next))
    } catch {
      // El estado sigue vivo en memoria aunque no se pueda persistir.
    }
    mutate(next, { revalidate: false })
    return next.includes(id)
  }

  return { ids: data, toggle }
}

export function FavoriteButton({
  id,
  title,
  size = "lg",
  iconOnly = false,
  className,
}: {
  id: number
  title: string
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm"
  iconOnly?: boolean
  className?: string
}) {
  const { ids, toggle } = useCollection("favorites")
  const active = ids.includes(id)

  return (
    <Button
      variant="outline"
      size={iconOnly ? (size === "lg" ? "icon-lg" : "icon-sm") : size}
      aria-pressed={active}
      aria-label={active ? `Quitar ${title} de favoritos` : `Añadir ${title} a favoritos`}
      onClick={() => {
        const added = toggle(id)
        toast(added ? "Añadido a favoritos" : "Eliminado de favoritos", {
          description: title,
        })
      }}
      className={cn(active && "border-primary/50 text-primary", className)}
    >
      <Heart
        data-icon={iconOnly ? undefined : "inline-start"}
        className={cn(active && "fill-current")}
      />
      {iconOnly ? null : active ? "En favoritos" : "Favoritos"}
    </Button>
  )
}

export function WatchlistButton({
  id,
  title,
  className,
}: {
  id: number
  title: string
  className?: string
}) {
  const { ids, toggle } = useCollection("watchlist")
  const active = ids.includes(id)

  return (
    <Button
      variant="ghost"
      size="lg"
      aria-pressed={active}
      onClick={() => {
        const added = toggle(id)
        toast(added ? "Añadido a Mi lista" : "Eliminado de Mi lista", {
          description: title,
        })
      }}
      className={cn(active && "text-cyan", className)}
    >
      {active ? (
        <Check data-icon="inline-start" />
      ) : (
        <Plus data-icon="inline-start" />
      )}
      {active ? "En mi lista" : "Mi lista"}
    </Button>
  )
}

export function BookmarkIconButton({ id, title }: { id: number; title: string }) {
  const { ids, toggle } = useCollection("watchlist")
  const active = ids.includes(id)

  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-pressed={active}
      aria-label={active ? `Quitar ${title} de mi lista` : `Guardar ${title} en mi lista`}
      onClick={() => toggle(id)}
      className={cn(active && "border-cyan/50 text-cyan")}
    >
      <Bookmark className={cn(active && "fill-current")} />
    </Button>
  )
}

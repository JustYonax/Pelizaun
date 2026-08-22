"use client"

import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCollection } from "@/components/media/library-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function LibrarySettings() {
  const favorites = useCollection("favorites")
  const watchlist = useCollection("watchlist")

  const clear = () => {
    if (!favorites.keys.length && !watchlist.keys.length) return
    if (!window.confirm("¿Vaciar favoritos y Mi lista? Esta acción no se puede deshacer.")) return
    favorites.keys.forEach((key) => {
      const [type, id] = key.split(":")
      favorites.toggle(type as "movie" | "tv", Number(id))
    })
    watchlist.keys.forEach((key) => {
      const [type, id] = key.split(":")
      watchlist.toggle(type as "movie" | "tv", Number(id))
    })
    toast("Biblioteca local vaciada")
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <h2 className="text-sm font-semibold">Biblioteca local</h2>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Favoritos y Mi lista se guardan solo en este navegador. {favorites.keys.length} favorito
        {favorites.keys.length === 1 ? "" : "s"} y {watchlist.keys.length} título
        {watchlist.keys.length === 1 ? "" : "s"} en tu lista.
      </p>
      <Separator />
      <Button
        variant="destructive"
        size="sm"
        onClick={clear}
        disabled={!favorites.keys.length && !watchlist.keys.length}
        className="w-fit rounded-xl"
      >
        <Trash2 data-icon="inline-start" />
        Vaciar biblioteca local
      </Button>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Activity, Bookmark, Heart, Puzzle } from "lucide-react"
import { useCollection } from "@/components/media/library-actions"

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: number
  hint: string
}) {
  return (
    <Link
      href={href}
      className="glass hover:border-primary/30 focus-visible:ring-ring flex flex-col gap-3 rounded-2xl p-5 outline-none transition-colors focus-visible:ring-2"
    >
      <div className="text-primary bg-primary/10 flex size-9 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
    </Link>
  )
}

export function DashboardStats({
  addonsOnline,
  addonsTotal,
}: {
  addonsOnline: number
  addonsTotal: number
}) {
  const favorites = useCollection("favorites")
  const watchlist = useCollection("watchlist")

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <StatCard
        href="/perfil"
        icon={<Heart className="size-4" />}
        label="Favoritos"
        value={favorites.keys.length}
        hint="Guardados en tu perfil"
      />
      <StatCard
        href="/perfil"
        icon={<Bookmark className="size-4" />}
        label="Mi lista"
        value={watchlist.keys.length}
        hint="Pendientes por ver"
      />
      <StatCard
        href="/addons"
        icon={<Puzzle className="size-4" />}
        label="Addons activos"
        value={addonsOnline}
        hint={`de ${addonsTotal} instalados`}
      />
      <StatCard
        href="/addons"
        icon={<Activity className="size-4" />}
        label="Estado del sistema"
        value={Math.round((addonsOnline / addonsTotal) * 100)}
        hint="% de fuentes operativas"
      />
    </div>
  )
}

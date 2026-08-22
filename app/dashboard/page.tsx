import type { Metadata } from "next"
import Link from "next/link"
import { Compass, Puzzle, Search, User } from "lucide-react"
import { getTrending } from "@/lib/tmdb"
import { ADDONS } from "@/lib/addons"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ContinueWatching } from "@/components/home/continue-watching"

export const metadata: Metadata = { title: "Dashboard" }

const QUICK_LINKS = [
  { href: "/explorar", label: "Explorador", description: "Filtra por género, año e idioma", icon: Compass },
  { href: "/buscar", label: "Búsqueda", description: "Encuentra un título al instante", icon: Search },
  { href: "/perfil", label: "Mi perfil", description: "Favoritos y mi lista", icon: User },
  { href: "/addons", label: "Addons y APIs", description: "Gestiona tus fuentes", icon: Puzzle },
]

export default async function DashboardPage() {
  const trending = await getTrending("week")
  const addonsOnline = ADDONS.filter((a) => a.enabled && a.status === "operativo").length

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="Biblioteca"
          title="Hola de nuevo, Yonaiky"
          description="Un vistazo rápido a tu actividad, tus listas y el estado de tus fuentes."
        />

        <DashboardStats addonsOnline={addonsOnline} addonsTotal={ADDONS.length} />

        <ContinueWatching items={trending.slice(0, 8)} />

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold sm:text-xl">Accesos rápidos</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="glass hover:border-primary/30 focus-visible:ring-ring flex flex-col gap-3 rounded-2xl p-5 outline-none transition-colors focus-visible:ring-2"
              >
                <link.icon className="text-primary size-5" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{link.label}</p>
                  <p className="text-muted-foreground text-xs">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </PageContainer>
    </AppShell>
  )
}

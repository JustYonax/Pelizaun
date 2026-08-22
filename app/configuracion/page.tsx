import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Moon, Puzzle, XCircle } from "lucide-react"
import { hasTmdbKey } from "@/lib/tmdb"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LibrarySettings } from "@/components/settings/library-settings"

export const metadata: Metadata = { title: "Configuración" }

export default function SettingsPage() {
  const connected = hasTmdbKey()

  return (
    <AppShell>
      <PageContainer className="max-w-3xl">
        <PageHeader
          eyebrow="Sistema"
          title="Configuración"
          description="Ajustes locales de la aplicación: fuentes de datos, apariencia y tu biblioteca."
        />

        <div className="flex flex-col gap-6">
          <div className="glass flex flex-col gap-4 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Fuente de datos</h2>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                {connected ? (
                  <CheckCircle2 className="text-[var(--success)] size-4" />
                ) : (
                  <XCircle className="text-destructive size-4" />
                )}
                <span>TMDB {connected ? "conectado" : "sin conectar"}</span>
              </div>
              {!connected ? (
                <span className="text-muted-foreground text-xs">
                  Añade <code className="bg-muted rounded px-1 py-0.5 font-mono">TMDB_API_KEY</code>
                </span>
              ) : null}
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Puzzle className="text-muted-foreground size-4" />
                <span>Addons y proveedores de reproducción</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/addons" />}
                nativeButton={false}
                className="rounded-xl"
              >
                Gestionar
              </Button>
            </div>
          </div>

          <div className="glass flex flex-col gap-4 rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Apariencia</h2>
            <div className="flex items-center gap-2.5 text-sm">
              <Moon className="text-cyan size-4" />
              <span>Tema oscuro PelisZaun</span>
              <span className="text-muted-foreground ml-auto text-xs">Único tema disponible</span>
            </div>
          </div>

          <LibrarySettings />
        </div>
      </PageContainer>
    </AppShell>
  )
}

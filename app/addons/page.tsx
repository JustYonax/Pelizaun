import type { Metadata } from "next"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { AddonsBoard } from "@/components/addons/addons-board"

export const metadata: Metadata = { title: "Addons y APIs" }

export default function AddonsPage() {
  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="Sistema"
          title="Addons y APIs"
          description="Fuentes de catálogo, metadatos, reproducción y sincronización que alimentan Pelizaun. Instala manifests Stremio o Pelizaun y ordénalos por prioridad."
        />
        <AddonsBoard />
      </PageContainer>
    </AppShell>
  )
}

import type { Metadata } from "next"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { LiveTv } from "@/components/live/live-tv"

export const metadata: Metadata = { title: "TV en vivo" }
export default function LivePage() {
  return <AppShell><PageContainer><PageHeader eyebrow="Directo" title="TV en vivo" description="Canales aportados por tus addons autorizados y activos." /><LiveTv /></PageContainer></AppShell>
}

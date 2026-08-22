import type { Metadata } from "next"
import { Settings } from "lucide-react"
import Link from "next/link"
import { AppShell, PageContainer } from "@/components/shell/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileTabs } from "@/components/profile/profile-tabs"

export const metadata: Metadata = { title: "Mi perfil" }

export default function ProfilePage() {
  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar size="lg" className="size-20">
            <AvatarImage src="/placeholder-user.jpg" alt="" />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
              YM
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold">Yonaiky</h1>
            <p className="text-muted-foreground text-sm">
              Miembro desde 2026 · Perfil local, sin sincronización en la nube todavía
            </p>
          </div>
          <Button
            variant="outline"
            render={<Link href="/configuracion" />}
            nativeButton={false}
            className="rounded-xl"
          >
            <Settings data-icon="inline-start" />
            Configuración
          </Button>
        </div>

        <ProfileTabs />
      </PageContainer>
    </AppShell>
  )
}

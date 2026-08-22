import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getDetail } from "@/lib/tmdb"
import type { MediaType } from "@/lib/types"
import { AppShell } from "@/components/shell/app-shell"
import { WatchView } from "@/components/watch/watch-view"
import { Spinner } from "@/components/ui/spinner"

type Params = { type: string; id: string }

function parseType(value: string): MediaType | null {
  return value === "movie" || value === "tv" ? value : null
}

async function loadDetail(params: Params) {
  const type = parseType(params.type)
  const id = Number(params.id)
  if (!type || Number.isNaN(id)) return null
  return getDetail(type, id)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const detail = await loadDetail(await params)
  if (!detail) return { title: "No encontrado" }
  return { title: `Ver ${detail.title}` }
}

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const detail = await loadDetail(await params)
  if (!detail) notFound()

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center gap-2 text-sm">
            <Spinner />
            Cargando reproductor…
          </div>
        }
      >
        <WatchView item={detail} />
      </Suspense>
    </AppShell>
  )
}

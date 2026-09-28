"use client"

import dynamic from "next/dynamic"
import type { MediaDetail } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

const WatchView = dynamic(
  () => import("@/components/watch/watch-view").then((mod) => ({ default: mod.WatchView })),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center gap-2 text-sm">
        <Spinner />
        Cargando reproductor…
      </div>
    ),
  },
)

export function WatchViewClient({ item }: { item: MediaDetail }) {
  return <WatchView item={item} />
}

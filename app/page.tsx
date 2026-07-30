import { Suspense } from "react"
import { AppShell } from "@/components/shell/app-shell"
import { HeroSection } from "@/components/home/hero-section"
import { HomeRows } from "@/components/home/home-rows"
import { HeroSkeleton, RowsSkeleton } from "@/components/home/home-skeletons"
import { MissingKeyNotice } from "@/components/home/missing-key-notice"
import { hasTmdbKey } from "@/lib/tmdb"

export default function HomePage() {
  if (!hasTmdbKey()) {
    return (
      <AppShell>
        <MissingKeyNotice />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-12 px-4 py-12 sm:px-6 xl:px-10">
        <Suspense fallback={<RowsSkeleton />}>
          <HomeRows />
        </Suspense>
      </div>
    </AppShell>
  )
}

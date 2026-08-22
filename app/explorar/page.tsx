import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react"
import { discover, getGenres, type DiscoverFilters } from "@/lib/tmdb"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { MediaCard } from "@/components/media/media-card"
import { ExploreFilters } from "@/components/explore/explore-filters"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const metadata: Metadata = { title: "Explorador" }

type SearchParams = Record<string, string | undefined>

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const type = sp.type === "tv" ? "tv" : "movie"

  const filters: DiscoverFilters = {
    type,
    genre: sp.genre,
    year: sp.year,
    language: sp.language,
    minRating: sp.minRating,
    sort: sp.sort || "popularity.desc",
    page: sp.page ? Math.max(1, Number(sp.page) || 1) : 1,
  }

  const [genres, { items, totalPages, totalResults }] = await Promise.all([
    getGenres(type),
    discover(filters),
  ])

  const pageParams = (page: number) => {
    const params = new URLSearchParams()
    if (sp.type) params.set("type", sp.type)
    if (sp.genre) params.set("genre", sp.genre)
    if (sp.year) params.set("year", sp.year)
    if (sp.language) params.set("language", sp.language)
    if (sp.minRating) params.set("minRating", sp.minRating)
    if (sp.sort) params.set("sort", sp.sort)
    params.set("page", String(page))
    return `/explorar?${params.toString()}`
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="Descubrir"
          title="Explorador"
          description={`${totalResults.toLocaleString("es-ES")} títulos disponibles con los filtros actuales`}
        />

        <ExploreFilters
          type={type}
          genres={genres}
          genre={sp.genre}
          year={sp.year}
          language={sp.language}
          minRating={sp.minRating}
          sort={filters.sort ?? "popularity.desc"}
        />

        {items.length ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item, index) => (
                <MediaCard key={`${item.mediaType}-${item.id}`} item={item} index={index} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 pt-4">
                {(filters.page ?? 1) <= 1 ? (
                  <Button variant="outline" size="sm" disabled className="rounded-xl">
                    <ChevronLeft data-icon="inline-start" />
                    Anterior
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={pageParams((filters.page ?? 1) - 1)} />}
                    nativeButton={false}
                    className="rounded-xl"
                  >
                    <ChevronLeft data-icon="inline-start" />
                    Anterior
                  </Button>
                )}
                <span className="text-muted-foreground text-sm tabular-nums">
                  Página {filters.page} de {totalPages}
                </span>
                {(filters.page ?? 1) >= totalPages ? (
                  <Button variant="outline" size="sm" disabled className="rounded-xl">
                    Siguiente
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={pageParams((filters.page ?? 1) + 1)} />}
                    nativeButton={false}
                    className="rounded-xl"
                  >
                    Siguiente
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <Empty className="border-border/60 bg-card/40 rounded-2xl border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Sin resultados</EmptyTitle>
              <EmptyDescription>
                Ningún título coincide con estos filtros. Prueba a ampliarlos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        )}
      </PageContainer>
    </AppShell>
  )
}

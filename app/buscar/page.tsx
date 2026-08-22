import type { Metadata } from "next"
import { SearchX } from "lucide-react"
import { searchMulti, getTrending } from "@/lib/tmdb"
import { AppShell, PageContainer, PageHeader } from "@/components/shell/app-shell"
import { SmartSearch } from "@/components/search/smart-search"
import { MediaCard } from "@/components/media/media-card"
import { MediaRow } from "@/components/media/media-row"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const metadata: Metadata = { title: "Buscar" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? "").trim()
  const hasQuery = query.length >= 2

  const [results, trending] = await Promise.all([
    hasQuery ? searchMulti(query) : Promise.resolve([]),
    hasQuery ? Promise.resolve([]) : getTrending("week"),
  ])

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="Descubrir"
          title={hasQuery ? `Resultados para "${query}"` : "Buscar en el catálogo"}
          description={
            hasQuery
              ? `${results.length} título${results.length === 1 ? "" : "s"} encontrado${results.length === 1 ? "" : "s"}`
              : "Busca por título, actor o palabra clave entre películas, series y anime."
          }
        />

        <div className="max-w-xl">
          <SmartSearch variant="page" autoFocus />
        </div>

        {hasQuery ? (
          results.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.map((item, index) => (
                <MediaCard key={`${item.mediaType}-${item.id}`} item={item} index={index} />
              ))}
            </div>
          ) : (
            <Empty className="border-border/60 bg-card/40 rounded-2xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>Sin resultados</EmptyTitle>
                <EmptyDescription>
                  No encontramos nada para {`"${query}"`}. Prueba con otro título, o revisa la
                  ortografía.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          )
        ) : (
          <MediaRow title="Tendencias esta semana" items={trending} />
        )}
      </PageContainer>
    </AppShell>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Clock, Loader2, Search, TrendingUp, X } from "lucide-react"
import type { MediaItem } from "@/lib/types"
import { typeLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { RatingBadge } from "@/components/media/meta-badges"

const RECENT_KEY = "nebula:recent-searches"
const SUGGESTIONS = [
  "Dune",
  "Interstellar",
  "Breaking Bad",
  "Anime 2026",
  "Terror psicológico",
  "Studio Ghibli",
]

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ items: MediaItem[] }>)

function useDebounced(value: string, delay = 260) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function SmartSearch({
  autoFocus = false,
  variant = "bar",
}: {
  autoFocus?: boolean
  variant?: "bar" | "page"
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const debounced = useDebounced(query)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored).slice(0, 6))
    } catch {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const { data, isLoading } = useSWR(
    debounced.trim().length >= 2
      ? `/api/search?q=${encodeURIComponent(debounced.trim())}`
      : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const results = data?.items ?? []

  const remember = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6)
    setRecent(next)
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      // Sin persistencia disponible: el historial vive solo en memoria.
    }
  }

  const submit = (term: string) => {
    const value = term.trim()
    if (!value) return
    remember(value)
    setOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(value)}`)
  }

  const showPanel = open || variant === "page"

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submit(query)
        }}
        className={cn(
          "glass focus-within:border-primary/50 flex items-center gap-3 rounded-2xl transition-colors",
          variant === "page" ? "h-14 px-5" : "h-11 px-4",
        )}
      >
        <Search
          className={cn(
            "text-muted-foreground shrink-0",
            variant === "page" ? "size-5" : "size-4",
          )}
        />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === "Escape") setOpen(false)
          }}
          placeholder="Buscar películas, series, personas…"
          aria-label="Buscar en el catálogo"
          className={cn(
            "placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none",
            variant === "page" ? "text-base" : "text-sm",
          )}
        />
        {isLoading ? (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
        ) : null}
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {showPanel && (query.length >= 2 || variant !== "page") ? (
        <div
          className={cn(
            "glass-strong absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl shadow-2xl",
            variant === "page" && query.length < 2 && "hidden",
          )}
        >
          {query.trim().length >= 2 ? (
            results.length ? (
              <ul className="max-h-[min(420px,60dvh)] overflow-y-auto p-2">
                {results.map((item) => (
                  <li key={`${item.mediaType}-${item.id}`}>
                    <Link
                      href={`/titulo/${item.mediaType}/${item.id}`}
                      onClick={() => {
                        remember(query.trim())
                        setOpen(false)
                      }}
                      className="hover:bg-accent/60 flex items-center gap-3 rounded-xl p-2 transition-colors"
                    >
                      <div className="bg-muted relative h-16 w-11 shrink-0 overflow-hidden rounded-lg">
                        {item.poster ? (
                          <Image
                            src={item.poster}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.year ?? "—"} · {typeLabel(item.mediaType)}
                        </p>
                      </div>
                      <RatingBadge rating={item.rating} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : !isLoading ? (
              <p className="text-muted-foreground p-6 text-center text-sm">
                Sin resultados para {`"${query}"`}
              </p>
            ) : null
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {recent.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                    <Clock className="size-3" /> Búsquedas recientes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => submit(term)}
                        className="bg-accent/60 hover:bg-accent rounded-full px-3 py-1.5 text-xs transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  <TrendingUp className="size-3" /> Sugerencias
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => submit(term)}
                      className="border-border hover:border-primary/50 hover:text-primary rounded-full border px-3 py-1.5 text-xs transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

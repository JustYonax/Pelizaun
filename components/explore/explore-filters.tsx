"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const YEARS = Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) =>
  String(new Date().getFullYear() - i),
)

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "ja", label: "Japonés" },
  { value: "ko", label: "Coreano" },
  { value: "fr", label: "Francés" },
]

const RATINGS = [
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
]

type Props = {
  type: "movie" | "tv"
  genres: { id: number; name: string }[]
  genre?: string
  year?: string
  language?: string
  minRating?: string
  sort: string
}

export function ExploreFilters({ type, genres, genre, year, language, minRating, sort }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const set = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") params.delete(key)
    else params.set(key, value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const recentSort = type === "movie" ? "primary_release_date.desc" : "first_air_date.desc"

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select value={type} onValueChange={(v) => set("type", v === "movie" ? undefined : v)}>
        <SelectTrigger className="w-32">
          <SelectValue>{(v: string) => (v === "tv" ? "Series" : "Películas")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="movie">Películas</SelectItem>
          <SelectItem value="tv">Series</SelectItem>
        </SelectContent>
      </Select>

      <Select value={genre ?? "all"} onValueChange={(v) => set("genre", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Género">
            {(v: string) => genres.find((g) => String(g.id) === v)?.name ?? "Todos los géneros"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los géneros</SelectItem>
          {genres.map((g) => (
            <SelectItem key={g.id} value={String(g.id)}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year ?? "all"} onValueChange={(v) => set("year", v)}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Año">
            {(v: string) => (v === "all" ? "Cualquier año" : v)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Cualquier año</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={language ?? "all"} onValueChange={(v) => set("language", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Idioma">
            {(v: string) => LANGUAGES.find((l) => l.value === v)?.label ?? "Cualquier idioma"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Cualquier idioma</SelectItem>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={minRating ?? "all"} onValueChange={(v) => set("minRating", v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Valoración">
            {(v: string) => RATINGS.find((r) => r.value === v)?.label ?? "Cualquier nota"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Cualquier nota</SelectItem>
          {RATINGS.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) => set("sort", v === "popularity.desc" ? undefined : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Orden">
            {(v: string) => {
              if (v === "vote_average.desc") return "Mejor valoradas"
              if (v === "original_title.asc") return "Alfabético"
              if (v === recentSort) return "Más recientes"
              return "Más populares"
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="popularity.desc">Más populares</SelectItem>
          <SelectItem value="vote_average.desc">Mejor valoradas</SelectItem>
          <SelectItem value={recentSort}>Más recientes</SelectItem>
          <SelectItem value="original_title.asc">Alfabético</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => router.push(pathname)}
      >
        <RotateCcw data-icon="inline-start" />
        Limpiar
      </Button>
    </div>
  )
}

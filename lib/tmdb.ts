/**
 * Capa de acceso a datos.
 *
 * Toda la app consume `MediaItem` / `MediaDetail`, nunca la forma cruda de TMDB.
 * Esto permite añadir nuevas fuentes (addons, otros proveedores) implementando
 * un normalizador que devuelva estos mismos tipos, sin tocar la interfaz.
 */

import type {
  MediaDetail,
  MediaItem,
  MediaType,
  PersonCredit,
  VideoClip,
} from "@/lib/types"

const BASE = "https://api.themoviedb.org/3"
export const IMG = "https://image.tmdb.org/t/p"

function rawKey() {
  return (process.env.TMDB_API_KEY ?? "").trim()
}

export function hasTmdbKey() {
  return rawKey().length > 0
}

type Params = Record<string, string | number | boolean | undefined>

async function tmdb<T>(
  path: string,
  params: Params = {},
  revalidate = 60 * 60,
): Promise<T | null> {
  const key = rawKey()
  if (!key) return null

  const url = new URL(`${BASE}${path}`)
  url.searchParams.set("language", "es-ES")
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
  }

  const headers: Record<string, string> = { accept: "application/json" }
  // Los tokens v4 son JWT; las claves v3 van como query param.
  if (key.startsWith("ey")) headers.Authorization = `Bearer ${key}`
  else url.searchParams.set("api_key", key)

  try {
    const res = await fetch(url, { headers, next: { revalidate } })
    if (!res.ok) {
      console.log("[v0] TMDB error", path, res.status)
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.log("[v0] TMDB fetch failed", path, (error as Error).message)
    return null
  }
}

/* ---------------------------------- utils --------------------------------- */

export function posterUrl(path: string | null, size: "w342" | "w500" = "w500") {
  return path ? `${IMG}/${size}${path}` : null
}

export function backdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280",
) {
  return path ? `${IMG}/${size}${path}` : null
}

const QUALITIES = ["4K HDR", "4K", "Dolby Vision", "1080p", "HDR10+"] as const
const AUDIO = ["Atmos 7.1", "DTS-HD 5.1", "AAC 5.1", "TrueHD 7.1"] as const

/** Metadatos de presentación deterministas por id (calidad/audio de la versión). */
export function qualityFor(id: number) {
  return QUALITIES[id % QUALITIES.length]
}
export function audioFor(id: number) {
  return AUDIO[id % AUDIO.length]
}

const LANG_LABEL: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  ja: "Japonés",
  ko: "Coreano",
  fr: "Francés",
  de: "Alemán",
  it: "Italiano",
  pt: "Portugués",
  zh: "Chino",
  hi: "Hindi",
  ru: "Ruso",
  da: "Danés",
  sv: "Sueco",
  no: "Noruego",
  tr: "Turco",
}

export function languageLabel(code?: string | null) {
  if (!code) return "—"
  return LANG_LABEL[code] ?? code.toUpperCase()
}

/* ------------------------------ normalización ----------------------------- */

type RawItem = {
  id: number
  media_type?: string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  original_language?: string
  popularity?: number
}

function normalize(raw: RawItem, fallbackType: MediaType = "movie"): MediaItem {
  const mediaType = (raw.media_type === "tv" || raw.media_type === "movie"
    ? raw.media_type
    : fallbackType) as MediaType
  const date = raw.release_date || raw.first_air_date || ""

  return {
    id: raw.id,
    mediaType,
    title: raw.title || raw.name || "Sin título",
    originalTitle: raw.original_title || raw.original_name || undefined,
    overview: raw.overview || "",
    poster: posterUrl(raw.poster_path ?? null),
    backdrop: backdropUrl(raw.backdrop_path ?? null),
    year: date ? Number(date.slice(0, 4)) : null,
    date: date || null,
    rating: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : 0,
    votes: raw.vote_count ?? 0,
    genreIds: raw.genre_ids ?? [],
    language: raw.original_language ?? null,
    popularity: raw.popularity ?? 0,
    quality: qualityFor(raw.id),
  }
}

function normalizeList(
  data: { results?: RawItem[] } | null,
  fallbackType: MediaType = "movie",
): MediaItem[] {
  if (!data?.results) return []
  return data.results
    .filter((r) => r.poster_path && (r.media_type ?? "movie") !== "person")
    .map((r) => normalize(r, fallbackType))
}

/* -------------------------------- catálogos ------------------------------- */

export async function getTrending(window: "day" | "week" = "week") {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>(`/trending/all/${window}`, {}, 60 * 30),
  )
}

export async function getPopularMovies(page = 1) {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>("/movie/popular", { page }),
    "movie",
  )
}

export async function getTopRatedMovies() {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>("/movie/top_rated"),
    "movie",
  )
}

export async function getNowPlaying() {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>("/movie/now_playing", {}, 60 * 60 * 6),
    "movie",
  )
}

export async function getPopularSeries() {
  return normalizeList(await tmdb<{ results: RawItem[] }>("/tv/popular"), "tv")
}

export async function getByGenre(
  genreId: number,
  type: MediaType = "movie",
  extra: Params = {},
) {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>(`/discover/${type}`, {
      with_genres: genreId,
      sort_by: "popularity.desc",
      "vote_count.gte": 150,
      ...extra,
    }),
    type,
  )
}

export async function getAnime() {
  return normalizeList(
    await tmdb<{ results: RawItem[] }>("/discover/tv", {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
    }),
    "tv",
  )
}

export type DiscoverFilters = {
  type?: MediaType
  genre?: string
  year?: string
  language?: string
  country?: string
  minRating?: string
  runtime?: string
  provider?: string
  sort?: string
  page?: number
}

export async function discover(filters: DiscoverFilters) {
  const type = filters.type ?? "movie"
  const params: Params = {
    sort_by: filters.sort || "popularity.desc",
    page: filters.page ?? 1,
    "vote_count.gte": filters.sort?.startsWith("vote_average") ? 300 : 20,
  }

  if (filters.genre) params.with_genres = filters.genre
  if (filters.language) params.with_original_language = filters.language
  if (filters.country) params.with_origin_country = filters.country
  if (filters.provider) {
    params.with_watch_providers = filters.provider
    params.watch_region = "ES"
  }
  if (filters.minRating) params["vote_average.gte"] = filters.minRating
  if (filters.year) {
    if (type === "movie") params.primary_release_year = filters.year
    else params.first_air_date_year = filters.year
  }
  if (filters.runtime && type === "movie") {
    const [min, max] = filters.runtime.split("-")
    if (min) params["with_runtime.gte"] = min
    if (max) params["with_runtime.lte"] = max
  }

  const data = await tmdb<{
    results: RawItem[]
    total_pages: number
    total_results: number
  }>(`/discover/${type}`, params, 60 * 15)

  return {
    items: normalizeList(data, type),
    totalPages: Math.min(data?.total_pages ?? 0, 500),
    totalResults: data?.total_results ?? 0,
  }
}

export async function searchMulti(query: string, page = 1) {
  if (!query.trim()) return []
  return normalizeList(
    await tmdb<{ results: RawItem[] }>(
      "/search/multi",
      { query, page, include_adult: false },
      60 * 5,
    ),
  )
}

export async function getGenres(type: MediaType = "movie") {
  const data = await tmdb<{ genres: { id: number; name: string }[] }>(
    `/genre/${type}/list`,
    {},
    60 * 60 * 24,
  )
  return data?.genres ?? []
}

/* --------------------------------- detalle -------------------------------- */

type RawDetail = RawItem & {
  runtime?: number
  episode_run_time?: number[]
  episode_run_time_alt?: number[]
  number_of_seasons?: number
  number_of_episodes?: number
  status?: string
  tagline?: string
  budget?: number
  revenue?: number
  homepage?: string
  genres?: { id: number; name: string }[]
  production_companies?: { id: number; name: string; logo_path: string | null }[]
  production_countries?: { iso_3166_1: string; name: string }[]
  spoken_languages?: { iso_639_1: string; name: string }[]
  belongs_to_collection?: { id: number; name: string; backdrop_path: string | null } | null
  credits?: {
    cast?: {
      id: number
      name: string
      character?: string
      profile_path: string | null
      order?: number
    }[]
    crew?: { id: number; name: string; job?: string; profile_path: string | null }[]
  }
  aggregate_credits?: {
    cast?: {
      id: number
      name: string
      profile_path: string | null
      roles?: { character: string }[]
    }[]
  }
  created_by?: { id: number; name: string; profile_path: string | null }[]
  videos?: { results?: { key: string; name: string; site: string; type: string }[] }
  images?: {
    backdrops?: { file_path: string; width: number; height: number }[]
    posters?: { file_path: string }[]
  }
  recommendations?: { results?: RawItem[] }
  similar?: { results?: RawItem[] }
  seasons?: {
    id: number
    name: string
    season_number: number
    episode_count: number
    poster_path: string | null
    air_date: string | null
    overview: string
  }[]
  reviews?: {
    results?: {
      id: string
      author: string
      content: string
      created_at: string
      author_details?: { rating: number | null; avatar_path: string | null }
    }[]
  }
  translations?: { translations?: { english_name: string; iso_639_1: string }[] }
  "watch/providers"?: {
    results?: Record<
      string,
      {
        link?: string
        flatrate?: { provider_id: number; provider_name: string; logo_path: string }[]
      }
    >
  }
}

export async function getDetail(
  type: MediaType,
  id: number,
): Promise<MediaDetail | null> {
  const append =
    type === "movie"
      ? "credits,videos,images,recommendations,similar,reviews,translations,watch/providers"
      : "aggregate_credits,credits,videos,images,recommendations,similar,reviews,translations,watch/providers"

  const raw = await tmdb<RawDetail>(
    `/${type}/${id}`,
    { append_to_response: append, include_image_language: "es,en,null" },
    60 * 60 * 12,
  )
  if (!raw) return null

  const base = normalize({ ...raw, media_type: type }, type)

  const regionProviders = raw["watch/providers"]?.results?.ES
  const providers = (regionProviders?.flatrate ?? [])
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: p.logo_path ? `${IMG}/w92${p.logo_path}` : null,
    }))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

  const cast: PersonCredit[] = (
    raw.aggregate_credits?.cast ??
    raw.credits?.cast ??
    []
  )
    .slice(0, 18)
    .map((p) => ({
      id: p.id,
      name: p.name,
      role:
        ("character" in p && p.character) ||
        ("roles" in p && p.roles?.[0]?.character) ||
        "",
      image: p.profile_path ? `${IMG}/w185${p.profile_path}` : null,
    }))

  const crew = raw.credits?.crew ?? []
  const directors = (
    type === "movie"
      ? crew.filter((c) => c.job === "Director")
      : (raw.created_by ?? []).map((c) => ({ ...c, job: "Creador" }))
  )
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.job ?? "Director",
      image: p.profile_path ? `${IMG}/w185${p.profile_path}` : null,
    }))

  const writers = crew
    .filter((c) => c.job === "Screenplay" || c.job === "Writer")
    .slice(0, 3)
    .map((p) => p.name)

  const videos: VideoClip[] = (raw.videos?.results ?? [])
    .filter((v) => v.site === "YouTube")
    .sort((a, b) => scoreVideo(b.type) - scoreVideo(a.type))
    .slice(0, 8)
    .map((v) => ({ key: v.key, name: v.name, type: v.type }))

  const runtime =
    raw.runtime ??
    (Array.isArray(raw.episode_run_time) ? raw.episode_run_time[0] : undefined) ??
    null

  return {
    ...base,
    tagline: raw.tagline || null,
    status: raw.status || null,
    runtime,
    seasonsCount: raw.number_of_seasons ?? null,
    episodesCount: raw.number_of_episodes ?? null,
    genres: raw.genres ?? [],
    companies: (raw.production_companies ?? []).slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
      logo: c.logo_path ? `${IMG}/w185${c.logo_path}` : null,
    })),
    countries: (raw.production_countries ?? []).map((c) => c.name),
    spokenLanguages: (raw.spoken_languages ?? []).map((l) => l.name),
    subtitleLanguages: (raw.translations?.translations ?? [])
      .slice(0, 14)
      .map((t) => t.english_name),
    collection: raw.belongs_to_collection
      ? {
          id: raw.belongs_to_collection.id,
          name: raw.belongs_to_collection.name,
          backdrop: backdropUrl(raw.belongs_to_collection.backdrop_path ?? null, "w780"),
        }
      : null,
    cast,
    directors,
    writers,
    videos,
    gallery: (raw.images?.backdrops ?? [])
      .slice(0, 12)
      .map((b) => `${IMG}/w780${b.file_path}`),
    seasons: (raw.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        id: s.id,
        name: s.name,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count,
        poster: posterUrl(s.poster_path, "w342"),
        airDate: s.air_date,
        overview: s.overview,
      })),
    reviews: (raw.reviews?.results ?? []).slice(0, 6).map((r) => ({
      id: r.id,
      author: r.author,
      content: r.content,
      createdAt: r.created_at,
      rating: r.author_details?.rating ?? null,
      avatar: r.author_details?.avatar_path
        ? `${IMG}/w185${r.author_details.avatar_path.replace(/^\//, "")}`
        : null,
    })),
    similar: [
      ...normalizeList(raw.recommendations ?? null, type),
      ...normalizeList(raw.similar ?? null, type),
    ]
      .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
      .slice(0, 14),
    providers,
    providersLink: regionProviders?.link ?? null,
  }
}

function scoreVideo(type: string) {
  if (type === "Trailer") return 3
  if (type === "Teaser") return 2
  return 1
}

export async function getSeasonEpisodes(id: number, seasonNumber: number) {
  const data = await tmdb<{
    episodes?: {
      id: number
      name: string
      episode_number: number
      overview: string
      runtime: number | null
      still_path: string | null
      air_date: string | null
      vote_average: number
    }[]
  }>(`/tv/${id}/season/${seasonNumber}`, {}, 60 * 60 * 12)

  return (data?.episodes ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    number: e.episode_number,
    overview: e.overview,
    runtime: e.runtime,
    still: e.still_path ? `${IMG}/w300${e.still_path}` : null,
    airDate: e.air_date,
    rating: e.vote_average,
  }))
}

export async function getWatchProviders() {
  const data = await tmdb<{
    results?: { provider_id: number; provider_name: string; logo_path: string }[]
  }>("/watch/providers/movie", { watch_region: "ES" }, 60 * 60 * 24)
  return (data?.results ?? []).slice(0, 24).map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
  }))
}

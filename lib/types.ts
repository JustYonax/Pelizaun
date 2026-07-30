export type MediaType = "movie" | "tv"

/** Unidad mínima de catálogo. Cualquier fuente/addon debe normalizar a esto. */
export type MediaItem = {
  id: number
  mediaType: MediaType
  title: string
  originalTitle?: string
  overview: string
  poster: string | null
  backdrop: string | null
  year: number | null
  date: string | null
  rating: number
  votes: number
  genreIds: number[]
  language: string | null
  popularity: number
  quality: string
}

export type PersonCredit = {
  id: number
  name: string
  role: string
  image: string | null
}

export type VideoClip = {
  key: string
  name: string
  type: string
}

export type SeasonSummary = {
  id: number
  name: string
  seasonNumber: number
  episodeCount: number
  poster: string | null
  airDate: string | null
  overview: string
}

export type Episode = {
  id: number
  name: string
  number: number
  overview: string
  runtime: number | null
  still: string | null
  airDate: string | null
  rating: number
}

export type Review = {
  id: string
  author: string
  content: string
  createdAt: string
  rating: number | null
  avatar: string | null
}

export type MediaDetail = MediaItem & {
  tagline: string | null
  status: string | null
  runtime: number | null
  seasonsCount: number | null
  episodesCount: number | null
  genres: { id: number; name: string }[]
  companies: { id: number; name: string; logo: string | null }[]
  countries: string[]
  spokenLanguages: string[]
  subtitleLanguages: string[]
  collection: { id: number; name: string; backdrop: string | null } | null
  cast: PersonCredit[]
  directors: PersonCredit[]
  writers: string[]
  videos: VideoClip[]
  gallery: string[]
  seasons: SeasonSummary[]
  reviews: Review[]
  similar: MediaItem[]
}

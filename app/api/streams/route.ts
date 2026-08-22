import { getStreamOptions } from "@/lib/streams"
import { getImdbId } from "@/lib/tmdb"
import type { MediaType } from "@/lib/types"

function parseMediaType(value: string | null): MediaType | null {
  if (value === "movie" || value === "tv") return value
  return null
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return undefined
  return parsed
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mediaType = parseMediaType(url.searchParams.get("type"))
  const id = Number(url.searchParams.get("id"))
  const season = parseOptionalNumber(url.searchParams.get("season"))
  const episode = parseOptionalNumber(url.searchParams.get("episode"))
  const addonUrls = url.searchParams.getAll("addon").slice(0, 10)

  if (!mediaType || Number.isNaN(id) || id <= 0) {
    return Response.json({ streams: [], warning: "Parámetros inválidos." }, { status: 400 })
  }

  const imdbId = await getImdbId(mediaType, id)
  const result = await getStreamOptions(
    {
      mediaType,
      id,
      imdbId,
      season,
      episode,
    },
    addonUrls,
  )

  return Response.json({ ...result, imdbId })
}

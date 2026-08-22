import { getSeasonEpisodes } from "@/lib/tmdb"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = Number(url.searchParams.get("id"))
  const season = Number(url.searchParams.get("season"))

  if (!id || Number.isNaN(season)) {
    return Response.json({ episodes: [] }, { status: 400 })
  }

  const episodes = await getSeasonEpisodes(id, season)
  return Response.json({ episodes })
}

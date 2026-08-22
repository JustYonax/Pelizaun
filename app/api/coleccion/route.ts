import { getDetail } from "@/lib/tmdb"
import type { MediaType } from "@/lib/types"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const raw = url.searchParams.get("keys") ?? ""
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 40)

  const items = await Promise.all(
    keys.map(async (key) => {
      const [type, idStr] = key.split(":")
      const id = Number(idStr)
      if ((type !== "movie" && type !== "tv") || Number.isNaN(id)) return null
      const detail = await getDetail(type as MediaType, id)
      if (!detail) return null
      const {
        cast,
        directors,
        writers,
        videos,
        gallery,
        seasons,
        reviews,
        similar,
        providers,
        providersLink,
        ...item
      } = detail
      return item
    }),
  )

  return Response.json({ items: items.filter(Boolean) })
}

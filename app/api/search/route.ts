import { searchMulti } from "@/lib/tmdb"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2) return Response.json({ items: [] })

  const items = await searchMulti(query)
  return Response.json({ items: items.slice(0, 8) })
}

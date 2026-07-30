import { getDetail, getTrending } from "@/lib/tmdb"
import { Hero } from "@/components/home/hero"

/** Elige el título destacado con backdrop y buena valoración. */
export async function HeroSection() {
  const trending = await getTrending("week")
  const candidate =
    trending.find((item) => item.backdrop && item.rating >= 6.5) ?? trending[0]

  if (!candidate) return null

  const detail = await getDetail(candidate.mediaType, candidate.id)
  if (!detail) return null

  return <Hero item={detail} />
}

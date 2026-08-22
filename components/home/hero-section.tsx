import { getDetail, getTrending } from "@/lib/tmdb"
import { HeroCarousel } from "@/components/home/hero-carousel"

/** Elige hasta 5 títulos destacados con backdrop y buena valoración para el carrusel. */
export async function HeroSection() {
  const trending = await getTrending("week")
  const qualified = trending.filter((item) => item.backdrop && item.rating >= 6.5)
  const candidates = (qualified.length ? qualified : trending).slice(0, 5)

  const details = (
    await Promise.all(candidates.map((item) => getDetail(item.mediaType, item.id)))
  ).filter((item) => item !== null)

  if (!details.length) return null

  return <HeroCarousel items={details} />
}

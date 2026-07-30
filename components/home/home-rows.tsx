import {
  getAnime,
  getByGenre,
  getNowPlaying,
  getPopularMovies,
  getPopularSeries,
  getTopRatedMovies,
  getTrending,
} from "@/lib/tmdb"
import { MediaRow } from "@/components/media/media-row"
import { ContinueWatching } from "@/components/home/continue-watching"

const GENRE = { accion: 28, terror: 27, sciFi: 878 } as const

export async function HomeRows() {
  const [
    trending,
    popular,
    topRated,
    nowPlaying,
    series,
    anime,
    accion,
    terror,
    sciFi,
  ] = await Promise.all([
    getTrending("week"),
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlaying(),
    getPopularSeries(),
    getAnime(),
    getByGenre(GENRE.accion),
    getByGenre(GENRE.terror),
    getByGenre(GENRE.sciFi),
  ])

  return (
    <>
      <ContinueWatching items={trending.slice(2, 8)} />
      <MediaRow
        title="Tendencias"
        subtitle="Lo que todo el mundo está viendo esta semana"
        items={trending}
        href="/explorar?sort=popularity.desc"
      />
      <MediaRow
        title="Más populares"
        subtitle="Los títulos con mayor audiencia ahora mismo"
        items={popular}
        href="/explorar?sort=popularity.desc"
      />
      <MediaRow
        title="Recomendadas para ti"
        subtitle="Seleccionadas por Taste Engine según tu historial"
        items={topRated}
        href="/explorar?sort=vote_average.desc"
      />
      <MediaRow
        title="Últimos estrenos"
        subtitle="Recién llegados a la plataforma"
        items={nowPlaying}
        href="/explorar?sort=primary_release_date.desc"
      />
      <MediaRow
        title="Acción"
        items={accion}
        href={`/explorar?genre=${GENRE.accion}`}
      />
      <MediaRow
        title="Ciencia ficción"
        items={sciFi}
        href={`/explorar?genre=${GENRE.sciFi}`}
      />
      <MediaRow title="Terror" items={terror} href={`/explorar?genre=${GENRE.terror}`} />
      <MediaRow
        title="Series"
        subtitle="Temporadas completas listas para maratón"
        items={series}
        href="/explorar?type=tv"
      />
      <MediaRow
        title="Anime"
        subtitle="Catálogo japonés con audio original y subtítulos"
        items={anime}
        href="/explorar?type=tv&genre=16&language=ja"
      />
    </>
  )
}

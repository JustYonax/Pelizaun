/**
 * Registro de fuentes/addons.
 *
 * La UI se construye a partir de este registro: añadir una entrada nueva es
 * suficiente para que aparezca en /addons y en el dashboard sin tocar el diseño.
 */

export type AddonCategory =
  | "catalogo"
  | "metadatos"
  | "reproduccion"
  | "subtitulos"
  | "recomendacion"
  | "sincronizacion"

export type AddonStatus = "operativo" | "degradado" | "caido" | "inactivo"

export type Addon = {
  id: string
  name: string
  description: string
  category: AddonCategory
  status: AddonStatus
  version: string
  enabled: boolean
  priority: number
  latency: number
  uptime: number
  requests24h: number
  official: boolean
  requiresKey: boolean
  endpoint: string
}

export const ADDON_CATEGORIES: Record<AddonCategory, string> = {
  catalogo: "Catálogo",
  metadatos: "Metadatos",
  reproduccion: "Reproducción",
  subtitulos: "Subtítulos",
  recomendacion: "Recomendación",
  sincronizacion: "Sincronización",
}

export const ADDONS: Addon[] = [
  {
    id: "tmdb",
    name: "TMDB",
    description:
      "Fuente principal de metadatos, catálogos, imágenes y trailers. Alimenta el descubrimiento de toda la aplicación.",
    category: "metadatos",
    status: "operativo",
    version: "3.0.4",
    enabled: true,
    priority: 1,
    latency: 118,
    uptime: 99.98,
    requests24h: 48210,
    official: true,
    requiresKey: true,
    endpoint: "https://api.themoviedb.org/3",
  },
  {
    id: "nebula-catalog",
    name: "Nebula Catalog",
    description:
      "Catálogo agregado propio: mezcla tendencias, estrenos y colecciones curadas por el equipo.",
    category: "catalogo",
    status: "operativo",
    version: "1.8.0",
    enabled: true,
    priority: 2,
    latency: 64,
    uptime: 99.99,
    requests24h: 31980,
    official: true,
    requiresKey: false,
    endpoint: "internal://catalog/v1",
  },
  {
    id: "opensubtitles",
    name: "OpenSubtitles",
    description:
      "Subtítulos multilingües con sincronización automática y búsqueda por hash de archivo.",
    category: "subtitulos",
    status: "operativo",
    version: "2.4.1",
    enabled: true,
    priority: 3,
    latency: 240,
    uptime: 99.4,
    requests24h: 9120,
    official: false,
    requiresKey: true,
    endpoint: "https://api.opensubtitles.com/api/v1",
  },
  {
    id: "stream-resolver",
    name: "Stream Resolver",
    description:
      "Resuelve versiones disponibles y selecciona la mejor pista según ancho de banda y dispositivo.",
    category: "reproduccion",
    status: "degradado",
    version: "0.9.7-beta",
    enabled: true,
    priority: 4,
    latency: 512,
    uptime: 96.2,
    requests24h: 15440,
    official: true,
    requiresKey: false,
    endpoint: "internal://resolver/v0",
  },
  {
    id: "trakt",
    name: "Trakt",
    description:
      "Sincroniza historial, listas y progreso entre dispositivos y clientes externos.",
    category: "sincronizacion",
    status: "operativo",
    version: "1.2.9",
    enabled: true,
    priority: 5,
    latency: 186,
    uptime: 99.1,
    requests24h: 4310,
    official: false,
    requiresKey: true,
    endpoint: "https://api.trakt.tv",
  },
  {
    id: "taste-engine",
    name: "Taste Engine",
    description:
      "Motor de recomendación vectorial entrenado sobre tu historial de reproducción.",
    category: "recomendacion",
    status: "operativo",
    version: "2.0.0",
    enabled: true,
    priority: 6,
    latency: 92,
    uptime: 99.7,
    requests24h: 22050,
    official: true,
    requiresKey: false,
    endpoint: "internal://taste/v2",
  },
  {
    id: "anilist",
    name: "AniList",
    description:
      "Metadatos especializados de anime: temporadas, estudios, orden de emisión y relaciones.",
    category: "metadatos",
    status: "inactivo",
    version: "1.0.3",
    enabled: false,
    priority: 7,
    latency: 0,
    uptime: 0,
    requests24h: 0,
    official: false,
    requiresKey: false,
    endpoint: "https://graphql.anilist.co",
  },
  {
    id: "fanart",
    name: "Fanart.tv",
    description:
      "Logos, banners y arte alternativo en alta resolución para heroes y colecciones.",
    category: "metadatos",
    status: "caido",
    version: "1.4.2",
    enabled: true,
    priority: 8,
    latency: 0,
    uptime: 87.5,
    requests24h: 640,
    official: false,
    requiresKey: true,
    endpoint: "https://webservice.fanart.tv/v3",
  },
]

export const STATUS_STYLES: Record<
  AddonStatus,
  { label: string; dot: string; text: string }
> = {
  operativo: {
    label: "Operativo",
    dot: "bg-[var(--success)]",
    text: "text-[var(--success)]",
  },
  degradado: {
    label: "Degradado",
    dot: "bg-[var(--warning)]",
    text: "text-[var(--warning)]",
  },
  caido: { label: "Caído", dot: "bg-destructive", text: "text-destructive" },
  inactivo: {
    label: "Inactivo",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
}

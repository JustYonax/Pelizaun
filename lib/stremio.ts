/**
 * Protocolo Stremio (manifest + rutas de stream).
 * Mantiene helpers isomorfos: no importar módulos de Node desde aquí.
 */

export type AddonProtocol = "pelizaun" | "stremio"

export type StremioConfigFieldType = "text" | "password" | "number" | "checkbox" | "select"

export type StremioConfigField = {
  key: string
  type: StremioConfigFieldType
  title: string
  default?: string
  options?: { value: string; label: string }[]
  required?: boolean
}

export type StremioManifest = {
  id: string
  name: string
  version: string
  description?: string
  resources: string[]
  types: string[]
  config: StremioConfigField[]
  configurationRequired: boolean
  configurable: boolean
  logo?: string
}

const CONFIG_TYPES: StremioConfigFieldType[] = [
  "text",
  "password",
  "number",
  "checkbox",
  "select",
]

function isConfigType(value: string): value is StremioConfigFieldType {
  return CONFIG_TYPES.includes(value as StremioConfigFieldType)
}

export function resourceNames(resources: unknown): string[] {
  if (!Array.isArray(resources)) return []
  return resources.flatMap((resource) => {
    if (typeof resource === "string") return [resource]
    if (resource && typeof resource === "object" && "name" in resource) {
      const name = (resource as { name?: unknown }).name
      return typeof name === "string" ? [name] : []
    }
    return []
  })
}

export function looksLikeStremioManifest(value: unknown): boolean {
  if (!value || typeof value !== "object") return false
  const raw = value as Record<string, unknown>
  return resourceNames(raw.resources).length > 0
}

function parseConfigField(value: unknown): StremioConfigField | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  if (typeof raw.key !== "string" || !raw.key.trim()) return null
  const type = typeof raw.type === "string" && isConfigType(raw.type) ? raw.type : "text"
  const options = Array.isArray(raw.options)
    ? raw.options.flatMap((option) => {
        if (typeof option === "string") return [{ value: option, label: option }]
        if (option && typeof option === "object") {
          const item = option as { value?: unknown; label?: unknown }
          if (typeof item.value === "string") {
            return [{ value: item.value, label: typeof item.label === "string" ? item.label : item.value }]
          }
        }
        return []
      })
    : undefined

  return {
    key: raw.key.slice(0, 80),
    type,
    title: typeof raw.title === "string" ? raw.title.slice(0, 80) : raw.key,
    default:
      typeof raw.default === "string" || typeof raw.default === "number" || typeof raw.default === "boolean"
        ? String(raw.default)
        : undefined,
    options,
    required: Boolean(raw.required),
  }
}

export function parseStremioManifest(value: unknown): StremioManifest {
  if (!value || typeof value !== "object") throw new Error("Manifest Stremio inválido")
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.version !== "string") {
    throw new Error("El manifest Stremio necesita id, name y version")
  }

  const resources = resourceNames(raw.resources)
  if (!resources.length) throw new Error("El addon Stremio no declara resources")

  const types = Array.isArray(raw.types)
    ? raw.types.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 40))
    : []

  const hints = (raw.behaviorHints ?? {}) as Record<string, unknown>
  const config = Array.isArray(raw.config)
    ? raw.config.flatMap((field) => {
        const parsed = parseConfigField(field)
        return parsed ? [parsed] : []
      })
    : []

  return {
    id: raw.id.slice(0, 80),
    name: raw.name.slice(0, 100),
    version: raw.version.slice(0, 30),
    description: typeof raw.description === "string" ? raw.description.slice(0, 500) : undefined,
    resources,
    types,
    config,
    configurable: Boolean(hints.configurable) || config.length > 0,
    configurationRequired: Boolean(hints.configurationRequired),
    logo: typeof raw.logo === "string" ? raw.logo : undefined,
  }
}

export function stremioTransportUrl(manifestUrl: string) {
  const url = new URL(manifestUrl)
  const path = url.pathname.replace(/\/manifest\.json$/i, "")
  url.pathname = path || "/"
  url.search = ""
  url.hash = ""
  return url
}

export function toStremioType(mediaType: "movie" | "tv") {
  switch (mediaType) {
    case "movie":
      return "movie"
    case "tv":
      return "series"
    default: {
      const exhaustive: never = mediaType
      throw new Error(`Tipo de medio no soportado: ${exhaustive}`)
    }
  }
}

export function stremioContentId(
  imdbId: string,
  mediaType: "movie" | "tv",
  season?: number,
  episode?: number,
) {
  if (mediaType === "tv" && season && episode) return `${imdbId}:${season}:${episode}`
  return imdbId
}

export function stremioStreamUrl(
  manifestUrl: string,
  mediaType: "movie" | "tv",
  imdbId: string,
  season?: number,
  episode?: number,
) {
  const transport = stremioTransportUrl(manifestUrl)
  const type = toStremioType(mediaType)
  const id = stremioContentId(imdbId, mediaType, season, episode)
  const suffix = `/stream/${type}/${id}.json`
  transport.pathname = `${transport.pathname.replace(/\/$/, "")}${suffix}`
  return transport
}

export function stremioManifestRoot(manifestUrl: string) {
  const url = new URL(manifestUrl)
  url.search = ""
  url.hash = ""
  const parts = url.pathname.split("/").filter(Boolean)
  const last = parts[parts.length - 1]
  const configSegment = parts[parts.length - 2]
  if (last?.toLowerCase() === "manifest.json" && configSegment && /%7b|{/i.test(configSegment)) {
    parts.splice(parts.length - 2, 1)
    url.pathname = `/${parts.join("/")}`
  }
  return url.toString()
}

export function applyStremioConfig(manifestUrl: string, config: Record<string, string>) {
  const entries = Object.entries(config).filter(([, value]) => String(value).trim().length > 0)
  if (!entries.length) return stremioManifestRoot(manifestUrl)

  const root = new URL(stremioManifestRoot(manifestUrl))
  const encoded = encodeURIComponent(JSON.stringify(Object.fromEntries(entries)))
  const path = root.pathname.replace(/\/manifest\.json$/i, "")
  root.pathname = `${path.replace(/\/$/, "")}/${encoded}/manifest.json`
  return root.toString()
}

export function compareVersion(current: string, latest: string) {
  const parse = (value: string) =>
    value
      .split(/[.+-]/)
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isNaN(part) ? 0 : part))

  const a = parse(current)
  const b = parse(latest)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0
    const right = b[index] ?? 0
    if (right > left) return 1
    if (right < left) return -1
  }
  return 0
}

export function extractQuality(text: string) {
  const match = text.match(/\b(2160p|1080p|720p|480p|360p|4k|uhd)\b/i)
  if (!match) return "adaptive"
  const value = match[1].toUpperCase()
  if (value === "4K" || value === "UHD" || value === "2160P") return "4K"
  return value.toLowerCase() === "2160p" ? "4K" : match[1]
}

export function extractSize(text: string) {
  const match = text.match(/\b(\d+(?:[.,]\d+)?\s?(?:GB|MB|TB))\b/i)
  return match ? match[1].replace(",", ".") : null
}

export function extractLanguage(text: string) {
  const match = text.match(/\b(es|spa|español|latino|castellano|en|eng|english|fr|vose|dual)\b/i)
  return match ? match[1] : null
}

export function qualityRank(quality: string) {
  const value = quality.toLowerCase()
  if (value.includes("2160") || value.includes("4k") || value.includes("uhd")) return 5
  if (value.includes("1080")) return 4
  if (value.includes("720")) return 3
  if (value.includes("480")) return 2
  if (value.includes("360")) return 1
  return 0
}

export function addonLog(scope: string, message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.warn(`[pelizaun:${scope}] ${message}`, extra)
    return
  }
  console.warn(`[pelizaun:${scope}] ${message}`)
}

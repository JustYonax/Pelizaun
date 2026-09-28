import type { MediaType, StreamKind, StreamOption } from "@/lib/types"
import {
  fetchJson,
  inspectAddonManifest,
  isDirectStreamUrl,
  isPlayableHttpUrl,
  logAddonFailure,
  safeHttpsUrl,
} from "@/lib/addon-server"
import type { InspectedAddon } from "@/lib/addon-protocol"
import {
  extractLanguage,
  extractQuality,
  extractSize,
  qualityRank,
  browserPlayRank,
  stremioStreamUrl,
} from "@/lib/stremio"

type StreamQuery = {
  mediaType: MediaType
  id: number
  imdbId?: string | null
  season?: number
  episode?: number
}

export type StreamResult = {
  streams: StreamOption[]
  warning: string | null
}

type RawStream = Record<string, unknown>

function streamText(stream: StreamOption) {
  return [stream.label, stream.details, stream.quality, stream.size].filter(Boolean).join(" ")
}

function sortStreams(streams: StreamOption[]) {
  return [...streams].sort((left, right) => {
    const playableDelta = Number(Boolean(right.playable)) - Number(Boolean(left.playable))
    if (playableDelta) return playableDelta
    const playRank = browserPlayRank(streamText(right)) - browserPlayRank(streamText(left))
    if (playRank) return playRank
    return qualityRank(right.quality) - qualityRank(left.quality)
  })
}

function streamKindFromUrl(url: string, embed: boolean): StreamKind {
  if (embed) return "embed"
  return "http"
}

function normalizeInfoHash(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const hash = value.trim()
  if (/^[a-fA-F0-9]{40}$/.test(hash) || /^[A-Z2-7]{32}$/i.test(hash)) return hash
  return undefined
}

function magnetFromRaw(raw: RawStream): string | undefined {
  if (typeof raw.magnet === "string" && raw.magnet.startsWith("magnet:")) return raw.magnet
  if (typeof raw.url === "string" && raw.url.startsWith("magnet:")) return raw.url
  return undefined
}

function extractTrackers(raw: RawStream): string[] {
  const sources = Array.isArray(raw.sources) ? raw.sources : []
  return sources.flatMap((source) => {
    if (typeof source !== "string") return []
    const value = source.startsWith("tracker:") ? source.slice("tracker:".length) : source
    if (/^(udp|http|https|ws|wss):\/\//i.test(value)) return [value]
    return []
  })
}

function mapStremioStream(
  raw: RawStream,
  index: number,
  addonName: string,
  addonId: string,
): StreamOption | null {
  const titleParts = [raw.name, raw.title, raw.description]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
  const text = titleParts.join("\n")
  const hints = (raw.behaviorHints ?? {}) as Record<string, unknown>
  const ytId = typeof raw.ytId === "string" ? raw.ytId : null
  const embed =
    Boolean(ytId && /^[\w-]{6,20}$/.test(ytId)) ||
    (typeof raw.url === "string" && raw.url.includes("youtube-nocookie.com/embed/"))
  const httpUrl = embed
    ? ytId
      ? `https://www.youtube-nocookie.com/embed/${ytId}`
      : isPlayableHttpUrl(raw.url)
    : isPlayableHttpUrl(raw.url)
  const infoHash = normalizeInfoHash(raw.infoHash)
  const magnet = magnetFromRaw(raw)
  const isTorrent = Boolean(infoHash || magnet)
  const fileIdx = typeof raw.fileIdx === "number" && Number.isInteger(raw.fileIdx) ? raw.fileIdx : undefined

  if (!text && !httpUrl && !isTorrent) return null

  if (httpUrl) {
    return {
      id: `${addonId}-${String(raw.url ?? raw.ytId ?? index)}`.slice(0, 180),
      provider: addonName,
      label: (titleParts[0] || "Reproducir").slice(0, 120),
      quality: extractQuality(text),
      language: extractLanguage(text),
      url: httpUrl,
      external: true,
      details: typeof raw.description === "string" ? raw.description.slice(0, 200) : titleParts[1],
      source: addonName,
      isSubscription: Boolean(raw.isSubscription),
      size: extractSize(text),
      playable: true,
      kind: streamKindFromUrl(httpUrl, embed),
    }
  }

  if (isTorrent) {
    return {
      id: `${addonId}-${String(infoHash ?? magnet ?? index)}`.slice(0, 180),
      provider: addonName,
      label: (titleParts[0] || "Reproducir").slice(0, 120),
      quality: extractQuality(text),
      language: extractLanguage(text),
      url: "",
      external: true,
      details: titleParts[1] ?? "Reproducción P2P (WebTorrent)",
      source: addonName,
      isSubscription: Boolean(raw.isSubscription),
      size: extractSize(text),
      playable: true,
      kind: "torrent",
      infoHash,
      magnet,
      fileIdx,
      trackers: extractTrackers(raw),
    }
  }

  if (hints.notWebReady === true) {
    return {
      id: `${addonId}-${String(index)}`.slice(0, 180),
      provider: addonName,
      label: (titleParts[0] || "Origen no compatible").slice(0, 120),
      quality: extractQuality(text),
      language: extractLanguage(text),
      url: "",
      external: true,
      details: "Este origen no se puede reproducir en el navegador.",
      source: addonName,
      playable: false,
      kind: "unavailable",
    }
  }

  return null
}

async function streamsFromPelizaun(inspected: InspectedAddon, query: StreamQuery) {
  if (!inspected.endpoints.streams) return []
  const endpoint = safeHttpsUrl(inspected.endpoints.streams)
  endpoint.searchParams.set("type", query.mediaType)
  endpoint.searchParams.set("tmdbId", String(query.id))
  if (query.imdbId) endpoint.searchParams.set("imdbId", query.imdbId)
  if (query.season) endpoint.searchParams.set("season", String(query.season))
  if (query.episode) endpoint.searchParams.set("episode", String(query.episode))
  const payload = await fetchJson(endpoint)
  const rawStreams = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { streams?: unknown }).streams)
      ? (payload as { streams: unknown[] }).streams
      : []

  return rawStreams.slice(0, 30).flatMap((value, index): StreamOption[] => {
    if (!value || typeof value !== "object") return []
    const raw = value as RawStream
    const url = isDirectStreamUrl(raw.url)
    if (!url || "infoHash" in raw || "magnet" in raw) return []
    return [
      {
        id: `${inspected.id}-${String(raw.id ?? index)}`,
        provider: inspected.name,
        label: typeof raw.label === "string" ? raw.label.slice(0, 120) : "Reproducir",
        quality: typeof raw.quality === "string" ? raw.quality.slice(0, 30) : "adaptive",
        language: typeof raw.language === "string" ? raw.language.slice(0, 20) : null,
        url,
        external: true,
        details: typeof raw.details === "string" ? raw.details.slice(0, 200) : undefined,
        source: inspected.name,
        isSubscription: Boolean(raw.isSubscription),
        playable: true,
        kind: "http",
      },
    ]
  })
}

async function streamsFromStremio(
  inspected: InspectedAddon,
  manifestRawUrl: string,
  query: StreamQuery,
) {
  if (!query.imdbId || !inspected.capabilities.includes("streams")) return []

  const endpoint = stremioStreamUrl(
    manifestRawUrl,
    query.mediaType,
    query.imdbId,
    query.season,
    query.episode,
  )
  const payload = await fetchJson(safeHttpsUrl(endpoint.toString()))
  const rawStreams =
    payload && typeof payload === "object" && Array.isArray((payload as { streams?: unknown }).streams)
      ? (payload as { streams: unknown[] }).streams
      : []

  return sortStreams(
    rawStreams.slice(0, 40).flatMap((value, index) => {
      if (!value || typeof value !== "object") return []
      const mapped = mapStremioStream(value as RawStream, index, inspected.name, inspected.id)
      return mapped ? [mapped] : []
    }),
  )
}

async function streamsFromAddon(manifestRawUrl: string, query: StreamQuery) {
  const manifestUrl = safeHttpsUrl(manifestRawUrl)
  const inspected = inspectAddonManifest(await fetchJson(manifestUrl), manifestUrl)

  switch (inspected.protocol) {
    case "pelizaun":
      return streamsFromPelizaun(inspected, query)
    case "stremio":
      return streamsFromStremio(inspected, manifestUrl.toString(), query)
    default: {
      const exhaustive: never = inspected.protocol
      throw new Error(`Protocolo no soportado: ${exhaustive}`)
    }
  }
}

export async function getStreamOptions(query: StreamQuery, addonUrls: string[] = []): Promise<StreamResult> {
  if (!addonUrls.length) {
    return {
      streams: [],
      warning: "No hay addons de reproducción activos. Instala uno en Addons y APIs.",
    }
  }

  const settled = await Promise.allSettled(
    addonUrls.slice(0, 10).map(async (url) => {
      try {
        return await streamsFromAddon(url, query)
      } catch (error) {
        logAddonFailure(url, error)
        throw error
      }
    }),
  )

  const streams = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
  const failed = settled.filter((result) => result.status === "rejected").length
  const missingImdb = !query.imdbId
  const warnings: string[] = []

  if (missingImdb) {
    warnings.push("No hay ID de IMDb para este título; los addons Stremio se omitieron.")
  }
  if (failed) {
    warnings.push(`${failed} addon${failed === 1 ? "" : "s"} no pudo responder.`)
  }
  if (!streams.length && !failed) {
    warnings.push("Ningún addon devolvió fuentes reproducibles para este título.")
  }

  return { streams, warning: warnings.length ? warnings.join(" ") : null }
}

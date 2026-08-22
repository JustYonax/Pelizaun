import type { MediaType, StreamOption } from "@/lib/types"
import { fetchJson, isDirectStreamUrl, parseManifest, safeHttpsUrl } from "@/lib/addon-server"

type StreamQuery = { mediaType: MediaType; id: number; season?: number; episode?: number }
export type StreamResult = { streams: StreamOption[]; warning: string | null }
type RawStream = Record<string, unknown>

async function streamsFromAddon(manifestRawUrl: string, query: StreamQuery) {
  const manifestUrl = safeHttpsUrl(manifestRawUrl)
  const manifest = parseManifest(await fetchJson(manifestUrl), manifestUrl)
  if (!manifest.endpoints.streams) return []
  const endpoint = safeHttpsUrl(manifest.endpoints.streams)
  endpoint.searchParams.set("type", query.mediaType)
  endpoint.searchParams.set("tmdbId", String(query.id))
  if (query.season) endpoint.searchParams.set("season", String(query.season))
  if (query.episode) endpoint.searchParams.set("episode", String(query.episode))
  const payload = await fetchJson(endpoint)
  const rawStreams = Array.isArray(payload) ? payload :
    payload && typeof payload === "object" && Array.isArray((payload as { streams?: unknown }).streams)
      ? (payload as { streams: unknown[] }).streams : []
  return rawStreams.slice(0, 30).flatMap((value, index): StreamOption[] => {
    if (!value || typeof value !== "object") return []
    const raw = value as RawStream
    const url = isDirectStreamUrl(raw.url)
    if (!url || "infoHash" in raw || "magnet" in raw) return []
    return [{
      id: `${manifest.id}-${String(raw.id ?? index)}`,
      provider: manifest.name,
      label: typeof raw.label === "string" ? raw.label.slice(0, 120) : "Reproducir",
      quality: typeof raw.quality === "string" ? raw.quality.slice(0, 30) : "adaptive",
      language: typeof raw.language === "string" ? raw.language.slice(0, 20) : null,
      url, external: true,
      details: typeof raw.details === "string" ? raw.details.slice(0, 200) : undefined,
      source: manifest.name,
      isSubscription: Boolean(raw.isSubscription),
    }]
  })
}

export async function getStreamOptions(query: StreamQuery, addonUrls: string[] = []): Promise<StreamResult> {
  if (!addonUrls.length) return { streams: [], warning: null }
  const settled = await Promise.allSettled(addonUrls.slice(0, 10).map((url) => streamsFromAddon(url, query)))
  const streams = settled.flatMap((result) => result.status === "fulfilled" ? result.value : [])
  const failed = settled.filter((result) => result.status === "rejected").length
  return { streams, warning: failed ? `${failed} addon${failed === 1 ? "" : "s"} no pudo responder.` : null }
}

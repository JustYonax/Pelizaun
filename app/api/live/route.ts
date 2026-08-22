import { fetchJson, isDirectStreamUrl, parseManifest, safeHttpsUrl } from "@/lib/addon-server"
import type { LiveChannel } from "@/lib/addon-protocol"

async function channelsFromAddon(rawManifestUrl: string) {
  const manifestUrl = safeHttpsUrl(rawManifestUrl)
  const manifest = parseManifest(await fetchJson(manifestUrl), manifestUrl)
  if (!manifest.endpoints.live) return []
  const payload = await fetchJson(safeHttpsUrl(manifest.endpoints.live))
  const rawChannels = Array.isArray(payload) ? payload : payload && typeof payload === "object" &&
    Array.isArray((payload as { channels?: unknown }).channels) ? (payload as { channels: unknown[] }).channels : []
  return rawChannels.slice(0, 500).flatMap((value, index): LiveChannel[] => {
    if (!value || typeof value !== "object") return []
    const raw = value as Record<string, unknown>
    const url = isDirectStreamUrl(raw.url)
    if (!url || typeof raw.name !== "string") return []
    let logo: string | null = null
    if (typeof raw.logo === "string") { try { logo = safeHttpsUrl(raw.logo).toString() } catch { logo = null } }
    return [{ id: `${manifest.id}-${String(raw.id ?? index)}`, name: raw.name.slice(0, 100), logo,
      category: typeof raw.category === "string" ? raw.category.slice(0, 60) : "General",
      country: typeof raw.country === "string" ? raw.country.slice(0, 30) : null,
      language: typeof raw.language === "string" ? raw.language.slice(0, 30) : null,
      url, addon: manifest.name }]
  })
}

export async function GET(request: Request) {
  const addonUrls = new URL(request.url).searchParams.getAll("addon").slice(0, 10)
  const settled = await Promise.allSettled(addonUrls.map(channelsFromAddon))
  const channels = settled.flatMap((result) => result.status === "fulfilled" ? result.value : [])
  const failed = settled.filter((result) => result.status === "rejected").length
  return Response.json({ channels, warning: failed ? `${failed} addon no pudo responder.` : null })
}

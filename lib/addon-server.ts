import { isIP } from "node:net"
import type { PelizaunManifest, InspectedAddon, AddonCapability } from "@/lib/addon-protocol"
import {
  addonLog,
  looksLikeStremioManifest,
  parseStremioManifest,
  type StremioManifest,
} from "@/lib/stremio"

const MAX_RESPONSE_BYTES = 2_000_000
const FETCH_TIMEOUT_MS = 5_000
const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"])

function isPrivateIpv4(host: string) {
  const parts = host.split(".").map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
}

export function safeHttpsUrl(raw: string, base?: string) {
  let url: URL
  try {
    url = base ? new URL(raw, base) : new URL(raw)
  } catch {
    throw new Error("La URL no es válida")
  }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== "https:") throw new Error("El addon debe usar HTTPS")
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || isPrivateIpv4(host)) {
    throw new Error("No se permiten direcciones locales o privadas")
  }
  if (isIP(host) === 6 && (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))) {
    throw new Error("No se permiten direcciones locales o privadas")
  }
  url.username = ""
  url.password = ""
  return url
}

export async function fetchJson(url: URL, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "Pelizaun/1.0 (compatible; Stremio)" },
      cache: "no-store",
      redirect: "follow",
    })
    if (response.url) {
      try {
        safeHttpsUrl(response.url)
      } catch {
        throw new Error("La redirección del addon no es segura")
      }
    }
    if (!response.ok) throw new Error(`El addon respondió ${response.status}`)
    const length = Number(response.headers.get("content-length") ?? 0)
    if (length > MAX_RESPONSE_BYTES) throw new Error("La respuesta es demasiado grande")
    const text = await response.text()
    if (text.length > MAX_RESPONSE_BYTES) throw new Error("La respuesta es demasiado grande")
    try {
      return JSON.parse(text) as unknown
    } catch {
      throw new Error("El addon no devolvió JSON válido")
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`El addon tardó más de ${timeoutMs / 1000} segundos en responder`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function parseManifest(value: unknown, manifestUrl: URL): PelizaunManifest {
  if (!value || typeof value !== "object") throw new Error("Manifest inválido")
  const raw = value as Record<string, unknown>
  const endpoints = (raw.endpoints ?? {}) as Record<string, unknown>
  const capabilities = Array.isArray(raw.capabilities)
    ? raw.capabilities.filter((x): x is "streams" | "live" => x === "streams" || x === "live")
    : []
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.version !== "string") {
    throw new Error("El manifest necesita id, name y version")
  }
  if (!capabilities.length) throw new Error("El addon no declara capacidades compatibles")
  const parsed: PelizaunManifest = {
    id: raw.id.slice(0, 80),
    name: raw.name.slice(0, 100),
    description: typeof raw.description === "string" ? raw.description.slice(0, 500) : undefined,
    version: raw.version.slice(0, 30),
    capabilities,
    endpoints: {},
  }
  if (capabilities.includes("streams") && typeof endpoints.streams === "string") {
    parsed.endpoints.streams = safeHttpsUrl(endpoints.streams, manifestUrl.toString()).toString()
  }
  if (capabilities.includes("live") && typeof endpoints.live === "string") {
    parsed.endpoints.live = safeHttpsUrl(endpoints.live, manifestUrl.toString()).toString()
  }
  if (!parsed.endpoints.streams && !parsed.endpoints.live) throw new Error("El addon no tiene endpoints válidos")
  return parsed
}

function stremioCapabilities(manifest: StremioManifest): AddonCapability[] {
  const capabilities: AddonCapability[] = []
  if (manifest.resources.includes("stream")) capabilities.push("streams")
  if (manifest.resources.includes("catalog")) capabilities.push("catalog")
  return capabilities
}

export function inspectAddonManifest(value: unknown, manifestUrl: URL): InspectedAddon {
  if (looksLikeStremioManifest(value)) {
    const manifest = parseStremioManifest(value)
    const capabilities = stremioCapabilities(manifest)
    if (!capabilities.includes("streams") && !capabilities.includes("catalog")) {
      throw new Error("El addon Stremio no ofrece stream ni catálogo")
    }
    return {
      protocol: "stremio",
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
      capabilities,
      types: manifest.types,
      resources: manifest.resources,
      configSchema: manifest.config,
      configurationRequired: manifest.configurationRequired,
      endpoints: {},
    }
  }

  const manifest = parseManifest(value, manifestUrl)
  return {
    protocol: "pelizaun",
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    capabilities: manifest.capabilities,
    types: [],
    resources: manifest.capabilities,
    configSchema: [],
    configurationRequired: false,
    endpoints: manifest.endpoints,
  }
}

export function isDirectStreamUrl(raw: unknown) {
  if (typeof raw !== "string" || /magnet:|\.torrent(?:$|\?)/i.test(raw)) return null
  try {
    const url = safeHttpsUrl(raw)
    const path = url.pathname.toLowerCase()
    if (![".m3u8", ".mp4", ".webm", ".mpd"].some((ext) => path.endsWith(ext))) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isPlayableHttpUrl(raw: unknown) {
  if (typeof raw !== "string" || /^\s*magnet:/i.test(raw) || /\.torrent(?:$|\?)/i.test(raw)) return null
  try {
    return safeHttpsUrl(raw).toString()
  } catch {
    return null
  }
}

export function logAddonFailure(name: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido"
  addonLog("addon", `${name}: ${message}`, error)
}

import { isIP } from "node:net"
import type { PelizaunManifest } from "@/lib/addon-protocol"

const MAX_RESPONSE_BYTES = 2_000_000
const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"])

function isPrivateIpv4(host: string) {
  const parts = host.split(".").map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)
}

export function safeHttpsUrl(raw: string, base?: string) {
  let url: URL
  try { url = base ? new URL(raw, base) : new URL(raw) } catch { throw new Error("La URL no es válida") }
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

export async function fetchJson(url: URL) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "PelisZaun/1.0" },
      cache: "no-store",
      redirect: "error",
    })
    if (!response.ok) throw new Error(`El addon respondió ${response.status}`)
    const length = Number(response.headers.get("content-length") ?? 0)
    if (length > MAX_RESPONSE_BYTES) throw new Error("La respuesta es demasiado grande")
    const text = await response.text()
    if (text.length > MAX_RESPONSE_BYTES) throw new Error("La respuesta es demasiado grande")
    return JSON.parse(text) as unknown
  } finally { clearTimeout(timeout) }
}

export function parseManifest(value: unknown, manifestUrl: URL): PelizaunManifest {
  if (!value || typeof value !== "object") throw new Error("Manifest inválido")
  const raw = value as Record<string, unknown>
  const endpoints = (raw.endpoints ?? {}) as Record<string, unknown>
  const capabilities = Array.isArray(raw.capabilities)
    ? raw.capabilities.filter((x): x is "streams" | "live" => x === "streams" || x === "live") : []
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.version !== "string") {
    throw new Error("El manifest necesita id, name y version")
  }
  if (!capabilities.length) throw new Error("El addon no declara capacidades compatibles")
  const parsed: PelizaunManifest = {
    id: raw.id.slice(0, 80), name: raw.name.slice(0, 100),
    description: typeof raw.description === "string" ? raw.description.slice(0, 500) : undefined,
    version: raw.version.slice(0, 30), capabilities, endpoints: {},
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

export function isDirectStreamUrl(raw: unknown) {
  if (typeof raw !== "string" || /magnet:|\.torrent(?:$|\?)/i.test(raw)) return null
  try {
    const url = safeHttpsUrl(raw)
    const path = url.pathname.toLowerCase()
    if (![".m3u8", ".mp4", ".webm", ".mpd"].some((ext) => path.endsWith(ext))) return null
    return url.toString()
  } catch { return null }
}

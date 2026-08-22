import {
  applyStremioConfig,
  type AddonProtocol,
  type StremioConfigField,
} from "@/lib/stremio"

export const CUSTOM_ADDONS_KEY = "pelizaun:custom-addons:v1"
const LEGACY_ADDONS_KEY = "pelizaun_addons"

export type AddonCapability = "streams" | "live" | "catalog"

export type InspectedAddon = {
  protocol: AddonProtocol
  id: string
  name: string
  description?: string
  version: string
  capabilities: AddonCapability[]
  types: string[]
  resources: string[]
  configSchema: StremioConfigField[]
  configurationRequired: boolean
  endpoints: {
    streams?: string
    live?: string
  }
}

export type CustomAddon = {
  id: string
  name: string
  description: string
  version: string
  manifestUrl: string
  capabilities: AddonCapability[]
  enabled: boolean
  protocol: AddonProtocol
  types: string[]
  resources: string[]
  config: Record<string, string>
  configSchema: StremioConfigField[]
  configurationRequired: boolean
  installedAt: string
}

export type PelizaunManifest = {
  id: string
  name: string
  description?: string
  version: string
  capabilities: ("streams" | "live")[]
  endpoints: {
    streams?: string
    live?: string
  }
}

export type LiveChannel = {
  id: string
  name: string
  logo: string | null
  category: string
  country: string | null
  language: string | null
  url: string
  addon: string
}

function isCapability(value: unknown): value is AddonCapability {
  return value === "streams" || value === "live" || value === "catalog"
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizeAddon(value: unknown): CustomAddon | null {
  const raw = asRecord(value)
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") return null

  const manifest = asRecord(raw.manifest)
  const capabilities = Array.isArray(raw.capabilities)
    ? raw.capabilities.filter(isCapability)
    : []
  const resources = Array.isArray(raw.resources)
    ? raw.resources.filter((item): item is string => typeof item === "string")
    : Array.isArray(manifest?.resources)
      ? (manifest.resources as unknown[]).filter((item): item is string => typeof item === "string")
      : []

  const protocol: AddonProtocol =
    raw.protocol === "stremio" || resources.includes("stream") ? "stremio" : "pelizaun"

  const enabled =
    typeof raw.enabled === "boolean"
      ? raw.enabled
      : typeof raw.isActive === "boolean"
        ? raw.isActive
        : true

  const manifestUrl =
    (typeof raw.manifestUrl === "string" && raw.manifestUrl) ||
    (typeof raw.url === "string" && raw.url) ||
    ""
  if (!manifestUrl) return null

  const config = asRecord(raw.config) ?? {}
  const normalizedConfig = Object.fromEntries(
    Object.entries(config).flatMap(([key, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"
        ? [[key, String(entry)]]
        : [],
    ),
  )

  return {
    id: raw.id.slice(0, 80),
    name: raw.name.slice(0, 100),
    description:
      typeof raw.description === "string"
        ? raw.description
        : typeof manifest?.description === "string"
          ? manifest.description
          : "Addon personalizado",
    version:
      typeof raw.version === "string"
        ? raw.version
        : typeof manifest?.version === "string"
          ? manifest.version
          : "0.0.0",
    manifestUrl,
    capabilities: capabilities.length
      ? capabilities
      : resources.includes("stream")
        ? ["streams"]
        : ["streams"],
    enabled,
    protocol,
    types: Array.isArray(raw.types)
      ? raw.types.filter((item): item is string => typeof item === "string")
      : [],
    resources,
    config: normalizedConfig,
    configSchema: Array.isArray(raw.configSchema)
      ? (raw.configSchema as StremioConfigField[])
      : [],
    configurationRequired: Boolean(raw.configurationRequired),
    installedAt: typeof raw.installedAt === "string" ? raw.installedAt : new Date().toISOString(),
  }
}

function readLegacyAddons(): CustomAddon[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(LEGACY_ADDONS_KEY) ?? "[]")
    if (!Array.isArray(value)) return []
    return value.flatMap((item) => {
      const addon = normalizeAddon(item)
      return addon ? [addon] : []
    })
  } catch {
    return []
  }
}

export function readCustomAddons(): CustomAddon[] {
  if (typeof window === "undefined") return []
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOM_ADDONS_KEY) ?? "[]")
    const current = Array.isArray(stored) ? stored.flatMap((item) => {
      const addon = normalizeAddon(item)
      return addon ? [addon] : []
    }) : []
    if (current.length) return current

    const legacy = readLegacyAddons()
    if (legacy.length) writeCustomAddons(legacy)
    return legacy
  } catch {
    return []
  }
}

export function writeCustomAddons(addons: CustomAddon[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CUSTOM_ADDONS_KEY, JSON.stringify(addons))
  window.localStorage.removeItem(LEGACY_ADDONS_KEY)
  window.dispatchEvent(new Event("pelizaun:addons-changed"))
}

export function addonProvides(addon: CustomAddon, capability: AddonCapability) {
  return addon.enabled && addon.capabilities.includes(capability)
}

export function withAddonConfig(addon: CustomAddon, config: Record<string, string>) {
  const nextUrl =
    addon.protocol === "stremio" ? applyStremioConfig(addon.manifestUrl, config) : addon.manifestUrl

  return { ...addon, config, manifestUrl: nextUrl }
}

export const CUSTOM_ADDONS_KEY = "pelizaun:custom-addons:v1"

export type CustomAddon = {
  id: string
  name: string
  description: string
  version: string
  manifestUrl: string
  capabilities: ("streams" | "live")[]
  enabled: boolean
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

export function readCustomAddons(): CustomAddon[] {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(window.localStorage.getItem(CUSTOM_ADDONS_KEY) ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function writeCustomAddons(addons: CustomAddon[]) {
  window.localStorage.setItem(CUSTOM_ADDONS_KEY, JSON.stringify(addons))
  window.dispatchEvent(new Event("pelizaun:addons-changed"))
}

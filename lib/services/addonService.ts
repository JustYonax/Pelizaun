import {
  readCustomAddons,
  withAddonConfig,
  writeCustomAddons,
  type CustomAddon,
  type InspectedAddon,
} from "@/lib/addon-protocol"
import { compareVersion } from "@/lib/stremio"

export type InspectResponse = {
  manifest?: InspectedAddon
  manifestUrl?: string
  error?: string
}

function inspectedToAddon(inspected: InspectedAddon, manifestUrl: string, previous?: CustomAddon): CustomAddon {
  return {
    id: inspected.id,
    name: inspected.name,
    description: inspected.description ?? previous?.description ?? "Addon personalizado",
    version: inspected.version,
    manifestUrl,
    capabilities: inspected.capabilities,
    enabled: previous?.enabled ?? true,
    protocol: inspected.protocol,
    types: inspected.types,
    resources: inspected.resources,
    config: previous?.config ?? {},
    configSchema: inspected.configSchema,
    configurationRequired: inspected.configurationRequired,
    installedAt: previous?.installedAt ?? new Date().toISOString(),
  }
}

async function inspectManifest(url: string): Promise<{ manifest: InspectedAddon; manifestUrl: string }> {
  const response = await fetch("/api/addons/inspect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  })
  const result = (await response.json()) as InspectResponse
  if (!response.ok || !result.manifest || !result.manifestUrl) {
    throw new Error(result.error ?? "No se pudo validar el addon")
  }
  return { manifest: result.manifest, manifestUrl: result.manifestUrl }
}

export const addonService = {
  getAddons(): CustomAddon[] {
    return readCustomAddons()
  },

  saveAddons(addons: CustomAddon[]): void {
    writeCustomAddons(addons)
  },

  async installAddon(manifestUrl: string): Promise<CustomAddon> {
    const { manifest, manifestUrl: canonicalUrl } = await inspectManifest(manifestUrl.trim())
    const existing = this.getAddons()
    const previous = existing.find((addon) => addon.id === manifest.id)
    const installed = inspectedToAddon(manifest, canonicalUrl, previous)
    if (previous) {
      this.saveAddons(existing.map((addon) => (addon.id === installed.id ? installed : addon)))
    } else {
      this.saveAddons([installed, ...existing])
    }
    return installed
  },

  removeAddon(addonId: string): void {
    this.saveAddons(this.getAddons().filter((addon) => addon.id !== addonId))
  },

  toggleAddon(addonId: string): void {
    this.saveAddons(
      this.getAddons().map((addon) =>
        addon.id === addonId ? { ...addon, enabled: !addon.enabled } : addon,
      ),
    )
  },

  reorderAddon(addonId: string, direction: "up" | "down"): void {
    const addons = [...this.getAddons()]
    const index = addons.findIndex((addon) => addon.id === addonId)
    if (index === -1) return
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= addons.length) return
    const current = addons[index]
    const swap = addons[target]
    if (!current || !swap) return
    addons[index] = swap
    addons[target] = current
    this.saveAddons(addons)
  },

  async saveConfig(addonId: string, config: Record<string, string>): Promise<CustomAddon> {
    const addons = this.getAddons()
    const current = addons.find((addon) => addon.id === addonId)
    if (!current) throw new Error("El addon ya no está instalado")
    const next = withAddonConfig(current, config)
    if (next.protocol === "stremio") {
      const { manifest, manifestUrl } = await inspectManifest(next.manifestUrl)
      const updated = inspectedToAddon(manifest, manifestUrl, { ...next, config })
      this.saveAddons(addons.map((addon) => (addon.id === addonId ? updated : addon)))
      return updated
    }
    this.saveAddons(addons.map((addon) => (addon.id === addonId ? next : addon)))
    return next
  },

  async refreshAddon(addonId: string): Promise<CustomAddon> {
    const current = this.getAddons().find((addon) => addon.id === addonId)
    if (!current) throw new Error("El addon ya no está instalado")
    const { manifest, manifestUrl } = await inspectManifest(current.manifestUrl)
    const updated = inspectedToAddon(manifest, manifestUrl, current)
    this.saveAddons(this.getAddons().map((addon) => (addon.id === addonId ? updated : addon)))
    return updated
  },

  async checkUpdates(): Promise<{ id: string; latestVersion: string; updateAvailable: boolean }[]> {
    const addons = this.getAddons()
    const settled = await Promise.allSettled(
      addons.map(async (addon) => {
        const { manifest } = await inspectManifest(addon.manifestUrl)
        return {
          id: addon.id,
          latestVersion: manifest.version,
          updateAvailable: compareVersion(addon.version, manifest.version) > 0,
        }
      }),
    )
    return settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
  },
}

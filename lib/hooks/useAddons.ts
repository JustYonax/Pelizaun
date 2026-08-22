"use client"

import { useCallback, useEffect, useState } from "react"
import { addonService } from "@/lib/services/addonService"
import type { CustomAddon } from "@/lib/addon-protocol"

export function useAddons() {
  const [addons, setAddons] = useState<CustomAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Record<string, string>>({})

  const refresh = useCallback(() => {
    setAddons(addonService.getAddons())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener("pelizaun:addons-changed", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("pelizaun:addons-changed", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [refresh])

  const installAddon = useCallback(async (url: string) => {
    setInstalling(true)
    setError(null)
    try {
      const addon = await addonService.installAddon(url)
      refresh()
      return addon
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Error al instalar el addon"
      setError(message)
      throw caught
    } finally {
      setInstalling(false)
    }
  }, [refresh])

  const removeAddon = useCallback((id: string) => {
    addonService.removeAddon(id)
    setUpdates((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    refresh()
  }, [refresh])

  const toggleAddon = useCallback((id: string) => {
    addonService.toggleAddon(id)
    refresh()
  }, [refresh])

  const reorderAddon = useCallback((id: string, direction: "up" | "down") => {
    addonService.reorderAddon(id, direction)
    refresh()
  }, [refresh])

  const saveConfig = useCallback(async (id: string, config: Record<string, string>) => {
    const saved = await addonService.saveConfig(id, config)
    refresh()
    return saved
  }, [refresh])

  const updateAddon = useCallback(async (id: string) => {
    const updated = await addonService.refreshAddon(id)
    setUpdates((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    refresh()
    return updated
  }, [refresh])

  const checkUpdates = useCallback(async () => {
    setCheckingUpdates(true)
    setError(null)
    try {
      const results = await addonService.checkUpdates()
      const next: Record<string, string> = {}
      for (const result of results) {
        if (result.updateAvailable) next[result.id] = result.latestVersion
      }
      setUpdates(next)
      return next
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No se pudieron comprobar actualizaciones"
      setError(message)
      throw caught
    } finally {
      setCheckingUpdates(false)
    }
  }, [])

  return {
    addons,
    loading,
    installing,
    checkingUpdates,
    error,
    updates,
    installAddon,
    removeAddon,
    toggleAddon,
    reorderAddon,
    saveConfig,
    updateAddon,
    checkUpdates,
  }
}

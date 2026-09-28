"use client"

import { useEffect } from "react"
import { cleanupHydration } from "@/lib/hydration"

export function ClientHydration() {
  useEffect(() => {
    cleanupHydration()
  }, [])

  return null
}

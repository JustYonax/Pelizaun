import {
  Compass,
  LayoutDashboard,
  Puzzle,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Descubrir",
    items: [
      { href: "/", label: "Inicio", icon: Sparkles },
      { href: "/explorar", label: "Explorador", icon: Compass },
      { href: "/buscar", label: "Búsqueda", icon: Search },
    ],
  },
  {
    label: "Biblioteca",
    items: [
      { href: "/perfil", label: "Mi perfil", icon: User },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/addons", label: "Addons y APIs", icon: Puzzle },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
]

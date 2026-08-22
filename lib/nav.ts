import {
  Clapperboard,
  Compass,
  Heart,
  Home,
  Puzzle,
  Radio,
  Settings,
  Sparkles,
  TrendingUp,
  Tv,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", label: "Inicio", icon: Home },
      { href: "/explorar", label: "Explorar", icon: Compass },
      { href: "/explorar?sort=popularity.desc", label: "Tendencias", icon: TrendingUp },
      { href: "/explorar?type=movie", label: "Películas", icon: Clapperboard },
      { href: "/explorar?type=tv", label: "Series", icon: Tv },
      { href: "/en-vivo", label: "TV en vivo", icon: Radio },
      { href: "/explorar?type=tv&genre=16&language=ja", label: "Anime", icon: Sparkles },
      { href: "/perfil?tab=watchlist", label: "Mi Lista", icon: Heart },
    ],
  },
  {
    label: "Herramientas",
    items: [{ href: "/addons", label: "Addons y APIs", icon: Puzzle }],
  },
  {
    label: "Ajustes",
    items: [
      { href: "/configuracion", label: "Configuración", icon: Settings },
      { href: "/perfil", label: "Perfil", icon: User },
    ],
  },
]

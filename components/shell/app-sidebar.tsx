"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { NAV_GROUPS } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { PelizaunMark } from "@/components/shell/pelizaun-mark"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0]
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-1 py-1 transition-opacity hover:opacity-80"
      >
        <PelizaunMark className="size-9" />
        <span className="font-display text-base leading-none font-semibold tracking-tight">
          PelisZaun
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-7 overflow-y-auto scrollbar-none">
        {NAV_GROUPS.map((group, index) => (
          <div key={group.label ?? `group-${index}`} className="flex flex-col gap-1.5">
            {group.label ? (
              <p className="text-muted-foreground px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    active
                      ? "text-foreground bg-[color-mix(in_oklab,var(--primary)_16%,transparent)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "bg-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-transform duration-300",
                      active ? "scale-y-100" : "scale-y-0",
                    )}
                    aria-hidden
                  />
                  <item.icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <Link
        href="/perfil"
        onClick={onNavigate}
        className="hover:bg-accent/50 focus-visible:ring-ring flex items-center gap-3 rounded-xl p-2.5 outline-none transition-colors focus-visible:ring-2"
      >
        <Avatar size="lg">
          <AvatarImage src="/placeholder-user.jpg" alt="" />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
            YM
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">Yonaiky</span>
          <span className="text-primary text-[11px] font-medium">Premium</span>
        </div>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="border-border/60 bg-sidebar/70 fixed top-0 left-0 z-40 hidden h-dvh w-[248px] border-r backdrop-blur-xl lg:block xl:w-[268px]">
      <SidebarContent />
    </aside>
  )
}

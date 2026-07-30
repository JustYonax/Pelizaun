"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity } from "lucide-react"
import { NAV_GROUPS } from "@/lib/nav"
import { ADDONS } from "@/lib/addons"
import { cn } from "@/lib/utils"
import { NebulaMark } from "@/components/shell/nebula-mark"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const online = ADDONS.filter((a) => a.enabled && a.status === "operativo").length

  return (
    <div className="flex h-full flex-col gap-8 p-5">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-1 py-1 transition-opacity hover:opacity-80"
      >
        <NebulaMark className="size-9" />
        <div className="flex flex-col">
          <span className="font-display text-base leading-none font-semibold tracking-tight">
            Nebula
          </span>
          <span className="text-muted-foreground text-[11px] leading-relaxed">
            Media Universe
          </span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-7 overflow-y-auto scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <p className="text-muted-foreground px-3 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
              {group.label}
            </p>
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
        href="/addons"
        onClick={onNavigate}
        className="glass hover:border-primary/30 flex flex-col gap-2 rounded-2xl p-4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="text-cyan size-4" />
          <span className="text-xs font-semibold">Estado de fuentes</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          {online} de {ADDONS.length} addons operativos
        </p>
        <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
          <div
            className="from-primary via-violet to-cyan h-full rounded-full bg-gradient-to-r"
            style={{ width: `${(online / ADDONS.length) * 100}%` }}
          />
        </div>
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

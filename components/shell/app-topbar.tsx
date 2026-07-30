"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarContent } from "@/components/shell/app-sidebar"
import { NebulaMark } from "@/components/shell/nebula-mark"
import { SmartSearch } from "@/components/search/smart-search"

export function AppTopbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6 xl:px-10">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
            aria-label="Abrir menú de navegación"
            className="lg:hidden"
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="bg-sidebar w-[280px] p-0">
            <SheetTitle className="sr-only">Navegación principal</SheetTitle>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <NebulaMark className="size-8" />
          <span className="font-display text-sm font-semibold">Nebula</span>
        </Link>

        <div className="hidden max-w-md flex-1 sm:block">
          <SmartSearch />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            className="relative rounded-full"
          >
            <Bell />
            <span className="bg-cyan absolute top-1.5 right-1.5 size-1.5 rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
              aria-label="Abrir menú de cuenta"
              className="rounded-full"
            >
              <Avatar className="size-8">
                <AvatarImage src="/placeholder-user.jpg" alt="" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  AN
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Alex Nebula</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/perfil" />}>
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/configuracion" />}>
                  Configuración
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 pb-3 sm:hidden">
        <SmartSearch />
      </div>
    </header>
  )
}

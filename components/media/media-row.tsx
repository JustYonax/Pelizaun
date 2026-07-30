"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { MediaItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { MediaCard } from "@/components/media/media-card"

type Props = {
  title: string
  subtitle?: string
  items: MediaItem[]
  href?: string
}

export function MediaRow({ title, subtitle, items, href }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const sync = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    sync()
    const el = scroller.current
    if (!el) return
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [sync])

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: "smooth" })
  }

  if (!items.length) return null

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground text-xs sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {href ? (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={href} />}
              nativeButton={false}
              className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              Ver todo
              <ChevronRight data-icon="inline-end" />
            </Button>
          ) : null}
          <div className="hidden items-center gap-1.5 sm:flex">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label={`Desplazar ${title} a la izquierda`}
              className="rounded-full"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label={`Desplazar ${title} a la derecha`}
              className="rounded-full"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </header>

      <div
        ref={scroller}
        onScroll={sync}
        className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
      >
        {items.map((item, index) => (
          <MediaCard
            key={`${item.mediaType}-${item.id}`}
            item={item}
            index={index}
            className="w-[136px] shrink-0 snap-start sm:w-[160px] lg:w-[178px] xl:w-[196px]"
          />
        ))}
      </div>
    </section>
  )
}

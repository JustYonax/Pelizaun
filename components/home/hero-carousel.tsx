"use client"

import { useEffect, useState } from "react"
import type { MediaDetail } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Hero } from "@/components/home/hero"

export function HeroCarousel({ items }: { items: MediaDetail[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (items.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 8000)
    return () => clearInterval(timer)
  }, [items.length])

  if (!items.length) return null

  return (
    <div className="relative">
      {items.map((item, i) => (
        <div
          key={`${item.mediaType}-${item.id}`}
          aria-hidden={i !== index}
          className={cn(
            "transition-opacity duration-700",
            i === index
              ? "relative z-10 opacity-100"
              : "pointer-events-none absolute inset-0 opacity-0",
          )}
        >
          <Hero item={item} />
        </div>
      ))}

      {items.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 sm:bottom-8">
          <div className="pointer-events-auto mx-auto flex w-full max-w-[1720px] gap-2 px-4 sm:px-6 xl:px-10">
            {items.map((item, i) => (
              <button
                key={`${item.mediaType}-${item.id}`}
                type="button"
                aria-label={`Ver destacado ${i + 1}: ${item.title}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "bg-primary w-8" : "w-1.5 bg-white/25 hover:bg-white/40",
                )}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

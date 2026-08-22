"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

export function MediaGallery({ title, images }: { title: string; images: string[] }) {
  const [active, setActive] = useState<string | null>(null)

  if (!images.length) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold sm:text-xl">Galería</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(src)}
            className="focus-visible:ring-ring bg-muted relative aspect-video overflow-hidden rounded-xl outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2"
          >
            <Image
              src={src}
              alt={`Imagen ${index + 1} de ${title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="w-[min(96vw,1100px)] max-w-none overflow-hidden border-white/10 bg-black p-0 sm:max-w-none">
          <DialogTitle className="sr-only">{`Imagen de ${title}`}</DialogTitle>
          <DialogDescription className="sr-only">Vista ampliada de la galería.</DialogDescription>
          {active ? (
            <div className="relative aspect-video w-full">
              <Image src={active} alt="" fill sizes="100vw" className="object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

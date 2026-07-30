"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  videoKey: string | null
  title: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function TrailerDialog({
  videoKey,
  title,
  label = "Ver trailer",
  variant = "secondary",
  size = "lg",
  className,
}: Props) {
  const [open, setOpen] = useState(false)

  if (!videoKey) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={variant} size={size} />}
        className={className}
      >
        <Play data-icon="inline-start" />
        {label}
      </DialogTrigger>
      <DialogContent className="w-[min(96vw,1080px)] max-w-none overflow-hidden border-white/10 p-0 sm:max-w-none">
        <DialogTitle className="sr-only">{`Trailer de ${title}`}</DialogTitle>
        <DialogDescription className="sr-only">
          Reproductor de video incrustado desde YouTube.
        </DialogDescription>
        <div className="aspect-video w-full bg-black">
          {open ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
              title={`Trailer de ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full border-0"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type { ReactNode } from "react"
import useSWR from "swr"
import type { MediaItem } from "@/lib/types"
import { useCollection, type Collection } from "@/components/media/library-actions"
import { MediaCard, MediaCardSkeleton } from "@/components/media/media-card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ items: MediaItem[] }>)

export function CollectionGrid({
  collection,
  icon,
  emptyTitle,
  emptyDescription,
}: {
  collection: Collection
  icon: ReactNode
  emptyTitle: string
  emptyDescription: string
}) {
  const { keys } = useCollection(collection)
  const { data, isLoading } = useSWR(
    keys.length ? `/api/coleccion?keys=${keys.join(",")}` : null,
    fetcher,
  )

  if (!keys.length) {
    return (
      <Empty className="border-border/60 bg-card/40 rounded-2xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: keys.length || 6 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item, index) => (
        <MediaCard key={`${item.mediaType}-${item.id}`} item={item} index={index} />
      ))}
    </div>
  )
}

"use client"

import { Bookmark, Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CollectionGrid } from "@/components/library/collection-grid"

export function ProfileTabs() {
  return (
    <Tabs defaultValue="favorites" className="gap-6">
      <TabsList>
        <TabsTrigger value="favorites">
          <Heart data-icon="inline-start" className="size-3.5" />
          Favoritos
        </TabsTrigger>
        <TabsTrigger value="watchlist">
          <Bookmark data-icon="inline-start" className="size-3.5" />
          Mi lista
        </TabsTrigger>
      </TabsList>

      <TabsContent value="favorites">
        <CollectionGrid
          collection="favorites"
          icon={<Heart />}
          emptyTitle="Sin favoritos todavía"
          emptyDescription="Toca el corazón en cualquier título para guardarlo aquí."
        />
      </TabsContent>

      <TabsContent value="watchlist">
        <CollectionGrid
          collection="watchlist"
          icon={<Bookmark />}
          emptyTitle="Tu lista está vacía"
          emptyDescription="Añade títulos a Mi lista desde su ficha para verlos más tarde."
        />
      </TabsContent>
    </Tabs>
  )
}

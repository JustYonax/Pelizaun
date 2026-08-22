import Image from "next/image"
import { User } from "lucide-react"
import type { PersonCredit } from "@/lib/types"

export function CastList({ title, people }: { title: string; people: PersonCredit[] }) {
  if (!people.length) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold sm:text-xl">{title}</h2>
      <div className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {people.map((person) => (
          <div key={person.id} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
            <div className="bg-muted ring-border/60 relative size-20 shrink-0 overflow-hidden rounded-full ring-1">
              {person.image ? (
                <Image src={person.image} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <User className="size-7" />
                </div>
              )}
            </div>
            <p className="line-clamp-2 text-xs font-semibold leading-tight">{person.name}</p>
            {person.role ? (
              <p className="text-muted-foreground line-clamp-1 text-[10px] leading-tight">
                {person.role}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

export function HeroSkeleton() {
  return (
    <div className="relative h-[62vh] min-h-[520px] w-full overflow-hidden border-b border-border/60">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="relative mx-auto flex h-full w-full max-w-[1720px] flex-col justify-end gap-5 px-4 pb-14 sm:px-6 xl:px-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-[min(560px,80%)]" />
        <Skeleton className="h-4 w-[min(460px,70%)]" />
        <Skeleton className="h-4 w-[min(380px,60%)]" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function RowSkeleton({ label }: { label?: string }) {
  return (
    <section className="flex flex-col gap-4" aria-label={label ?? "Cargando contenido"}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex w-[172px] shrink-0 flex-col gap-3">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      {Array.from({ length: 4 }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  )
}

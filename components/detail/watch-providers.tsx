import Image from "next/image"
import { Tv } from "lucide-react"
import type { WatchProvider } from "@/lib/types"

export function WatchProviders({
  providers,
  link,
}: {
  providers: WatchProvider[]
  link: string | null
}) {
  if (!providers.length) return null

  const content = (
    <div className="flex flex-wrap items-center gap-2.5">
      {providers.map((provider) =>
        provider.logo ? (
          <div
            key={provider.id}
            title={provider.name}
            className="relative size-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
          >
            <Image src={provider.logo} alt={provider.name} fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <span key={provider.id} className="glass rounded-full px-3 py-1.5 text-xs font-medium">
            {provider.name}
          </span>
        ),
      )}
    </div>
  )

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Tv className="text-primary size-4" />
        Disponible en streaming
      </h2>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="focus-visible:ring-ring w-fit rounded-xl outline-none focus-visible:ring-2"
        >
          {content}
        </a>
      ) : (
        content
      )}
      <p className="text-muted-foreground text-[11px] leading-relaxed">
        Datos de disponibilidad proporcionados por JustWatch vía TMDB. Puede variar según tu
        región y suscripción.
      </p>
    </div>
  )
}

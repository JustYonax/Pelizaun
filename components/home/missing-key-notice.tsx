import { KeyRound } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function MissingKeyNotice() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-24 sm:px-6">
      <Empty className="rounded-2xl border border-border/60 bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRound />
          </EmptyMedia>
          <EmptyTitle>Falta la clave de TMDB</EmptyTitle>
          <EmptyDescription>
            PelisZaun usa el catálogo de The Movie Database para poblar todo el contenido. Añade la variable de entorno
            {" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">TMDB_API_KEY</code>{" "}
            en los ajustes del proyecto y recarga esta página.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <p className="text-sm text-muted-foreground">
            Puedes generar una clave gratuita desde tu cuenta de TMDB, en Settings → API. Se aceptan tanto la API Key
            v3 como el Read Access Token v4.
          </p>
        </EmptyContent>
      </Empty>
    </div>
  )
}

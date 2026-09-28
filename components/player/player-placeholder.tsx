export function PlayerPlaceholder({
  message = "Cargando reproductor…",
}: {
  message?: string
}) {
  return (
    <div className="ring-border/60 relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1">
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}

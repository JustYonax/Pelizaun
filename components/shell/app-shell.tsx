import { AppSidebar } from "@/components/shell/app-sidebar"
import { AppTopbar } from "@/components/shell/app-topbar"

/** Contenedor común de todas las pantallas: sidebar fijo + topbar sticky. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppSidebar />
      <div className="lg:pl-[248px] xl:pl-[268px]">
        <AppTopbar />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
      </div>
    </div>
  )
}

/** Envoltura de contenido con el ritmo de espaciado del sistema. */
export function PageContainer({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-[1720px] flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 xl:px-10 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <p className="text-primary text-[11px] font-semibold tracking-[0.16em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

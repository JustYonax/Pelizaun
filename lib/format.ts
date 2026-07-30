export function formatRuntime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatHours(minutes: number) {
  const h = Math.round(minutes / 60)
  if (h < 1000) return `${h} h`
  return `${(h / 1000).toFixed(1)} mil h`
}

export function formatVotes(votes: number) {
  if (votes >= 1000) return `${(votes / 1000).toFixed(1)}K`
  return String(votes)
}

export function formatDate(value?: string | null) {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

/** Pseudoaleatorio estable: mismo id, mismo valor en servidor y cliente. */
export function seeded(id: number, max = 100, offset = 0) {
  const x = Math.sin(id * 12.9898 + offset * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

export function typeLabel(type: "movie" | "tv") {
  return type === "movie" ? "Película" : "Serie"
}

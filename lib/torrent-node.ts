import WebTorrent from "webtorrent"
import os from "node:os"
import path from "node:path"

const NODE_TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.theoks.net:6969/announce",
  "udp://explodie.org:6969/announce",
  "udp://open.demonii.com:1337/announce",
  "http://tracker.opentrackr.org:1337/announce",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
]

type TorrentFileLike = {
  name: string
  path?: string
  length: number
  type?: string
  streamURL?: string
  select: (priority?: number) => void
  deselect: () => void
  stream: (opts?: { start?: number; end?: number }) => ReadableStream<Uint8Array>
}

type TorrentLike = {
  infoHash: string
  name?: string
  ready: boolean
  numPeers: number
  downloadSpeed: number
  progress: number
  files: TorrentFileLike[]
  destroy: (opts?: { destroyStore?: boolean } | (() => void), cb?: () => void) => void
  once: (event: string, handler: (error?: Error) => void) => void
  on: (event: string, handler: (error?: Error) => void) => void
}

type StoredSource = {
  magnet?: string
  trackers: string[]
  fileIdx?: number
}

type TorrentHttpServer = {
  pathname: string
  listen: (port: number, host: string, cb?: () => void) => void
  address: () => { port: number } | string | null
}

type TorrentClient = {
  torrents: TorrentLike[]
  add: (
    id: string,
    opts: {
      announce?: string[]
      strategy?: "sequential" | "rarest"
      destroyStoreOnDestroy?: boolean
      storeCacheSlots?: number
      path?: string
    },
    cb?: (torrent: TorrentLike) => void,
  ) => TorrentLike
  get: (id: string) => TorrentLike | undefined
  on: (event: string, handler: (error?: Error) => void) => void
  createServer: (opts?: { origin?: string; hostname?: string }) => TorrentHttpServer
}

type WebTorrentModule = (new (opts?: Record<string, unknown>) => TorrentClient) & {
  default?: new (opts?: Record<string, unknown>) => TorrentClient
}

function webTorrentCtor() {
  const imported = WebTorrent as unknown as WebTorrentModule
  if (typeof imported === "function") return imported
  if (typeof imported.default === "function") return imported.default
  throw new Error("WebTorrent no está disponible en el servidor")
}

const globalForTorrent = globalThis as unknown as {
  pelizaunTorrentClient?: TorrentClient
  pelizaunTorrentAdding?: Map<string, TorrentLike>
  pelizaunTorrentSources?: Map<string, StoredSource>
  pelizaunTorrentPort?: number
  pelizaunTorrentServer?: TorrentHttpServer
  pelizaunTorrentStopTimers?: Map<string, ReturnType<typeof setTimeout>>
}

function getSources() {
  if (!globalForTorrent.pelizaunTorrentSources) {
    globalForTorrent.pelizaunTorrentSources = new Map()
  }
  return globalForTorrent.pelizaunTorrentSources
}

function getAdding() {
  if (!globalForTorrent.pelizaunTorrentAdding) {
    globalForTorrent.pelizaunTorrentAdding = new Map()
  }
  return globalForTorrent.pelizaunTorrentAdding
}

function getStopTimers() {
  if (!globalForTorrent.pelizaunTorrentStopTimers) {
    globalForTorrent.pelizaunTorrentStopTimers = new Map()
  }
  return globalForTorrent.pelizaunTorrentStopTimers
}

function cancelScheduledStop(hash: string) {
  const timers = getStopTimers()
  const timer = timers.get(hash)
  if (!timer) return
  clearTimeout(timer)
  timers.delete(hash)
}

function ignoreTorrentError(error?: Error) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  return /duplicate torrent|WebSocket|tracker|destroy|abort/i.test(message)
}

function ensureHttpServer(client: TorrentClient) {
  if (globalForTorrent.pelizaunTorrentPort || globalForTorrent.pelizaunTorrentServer) return
  try {
    globalForTorrent.pelizaunTorrentServer = client.createServer({
      origin: "*",
      hostname: "127.0.0.1",
    })
  } catch {
    return
  }
  globalForTorrent.pelizaunTorrentServer.listen(0, "127.0.0.1", () => {
    const addr = globalForTorrent.pelizaunTorrentServer?.address()
    if (addr && typeof addr !== "string") {
      globalForTorrent.pelizaunTorrentPort = addr.port
    }
  })
}

function getClient() {
  if (!globalForTorrent.pelizaunTorrentClient) {
    const Client = webTorrentCtor()
    const client = new Client({
      dht: true,
      lsd: true,
      maxConns: 12,
    })
    client.on("error", (error) => {
      if (!ignoreTorrentError(error)) {
        console.warn("[pelizaun torrent]", error instanceof Error ? error.message : error)
      }
    })
    globalForTorrent.pelizaunTorrentClient = client
  }
  ensureHttpServer(globalForTorrent.pelizaunTorrentClient)
  return globalForTorrent.pelizaunTorrentClient
}

function sameHash(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase()
}

export function isInfoHash(value: string) {
  return /^[a-fA-F0-9]{40}$/.test(value) || /^[A-Z2-7]{32}$/i.test(value)
}

export function buildMagnet(infoHash: string, extraTrackers: string[] = []) {
  const trackers = [...new Set([...NODE_TRACKERS, ...extraTrackers])]
    .map((tracker) => `&tr=${encodeURIComponent(tracker)}`)
    .join("")
  return `magnet:?xt=urn:btih:${infoHash}${trackers}`
}

export function pickVideoFile(files: TorrentFileLike[], fileIdx?: number) {
  if (typeof fileIdx === "number" && files[fileIdx]) return files[fileIdx]
  if (!files.length) return undefined
  const videos = files.filter((file) => /\.(mp4|m4v|webm|mkv|mov)$/i.test(file.name))
  const html5 = videos.filter((file) => /\.(mp4|m4v|webm)$/i.test(file.name))
  const pool = html5.length ? html5 : videos.length ? videos : files
  return pool.reduce((best, file) => (file.length > best.length ? file : best))
}

function waitReady(torrent: TorrentLike, timeoutMs: number) {
  if (torrent.ready) return Promise.resolve(torrent)
  return new Promise<TorrentLike>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("No se encontraron peers a tiempo. Prueba otra fuente."))
    }, timeoutMs)
    torrent.once("ready", () => {
      clearTimeout(timer)
      resolve(torrent)
    })
  })
}

export function peekTorrent(infoHash: string) {
  const hash = infoHash.toLowerCase()
  return (
    getAdding().get(hash) ??
    getClient().torrents.find((torrent) => sameHash(torrent.infoHash ?? "", hash))
  )
}

export function startTorrent(opts: {
  infoHash: string
  magnet?: string
  trackers?: string[]
  fileIdx?: number
}) {
  const hash = opts.infoHash.toLowerCase()
  cancelScheduledStop(hash)
  getSources().set(hash, {
    magnet: opts.magnet,
    trackers: opts.trackers ?? [],
    fileIdx: opts.fileIdx,
  })

  const existing = peekTorrent(hash)
  if (existing) {
    if (existing.ready) {
      pickVideoFile(existing.files, opts.fileIdx)?.select(1)
    }
    return existing
  }

  const magnet = opts.magnet?.startsWith("magnet:")
    ? opts.magnet
    : buildMagnet(opts.infoHash, opts.trackers)
  try {
    const torrent = getClient().add(magnet, {
      announce: [...NODE_TRACKERS, ...(opts.trackers ?? [])],
      strategy: "sequential",
      destroyStoreOnDestroy: true,
      storeCacheSlots: 2,
      path: path.join(os.tmpdir(), "pelizaun-torrents"),
    })
    getAdding().set(hash, torrent)
    torrent.on("error", (error) => {
      if (!ignoreTorrentError(error)) {
        console.warn("[pelizaun torrent]", error instanceof Error ? error.message : error)
      }
    })
    torrent.once("ready", () => {
      getAdding().delete(hash)
      for (const file of torrent.files) file.deselect()
      pickVideoFile(torrent.files, opts.fileIdx)?.select(1)
    })
    return torrent
  } catch (error) {
    const fallback = peekTorrent(hash)
    if (fallback) return fallback
    throw error
  }
}

export function torrentStatus(torrent: TorrentLike, fileIdx?: number) {
  const file = torrent.ready ? pickVideoFile(torrent.files, fileIdx) : undefined
  const port = globalForTorrent.pelizaunTorrentPort
  let playbackUrl: string | null = null
  if (port && file) {
    try {
      playbackUrl = file.streamURL ? `http://127.0.0.1:${port}${file.streamURL}` : null
    } catch {
      playbackUrl = null
    }
  }
  return {
    ready: torrent.ready,
    progress: Math.round(torrent.progress * 100),
    peers: torrent.numPeers,
    downloadSpeed: torrent.downloadSpeed,
    name: torrent.name ?? null,
    fileName: file?.name ?? null,
    fileLength: file?.length ?? null,
    playbackUrl,
  }
}

export function startTorrentFromStore(infoHash: string, fileIdx?: number) {
  const stored = getSources().get(infoHash.toLowerCase())
  return startTorrent({
    infoHash,
    magnet: stored?.magnet,
    trackers: stored?.trackers ?? [],
    fileIdx: fileIdx ?? stored?.fileIdx,
  })
}

export function stopTorrent(infoHash: string) {
  const hash = infoHash.toLowerCase()
  cancelScheduledStop(hash)
  getAdding().delete(hash)
  getSources().delete(hash)
  const torrent = peekTorrent(hash)
  if (!torrent) return Promise.resolve()
  return new Promise<void>((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    try {
      torrent.destroy({ destroyStore: true }, done)
    } catch {
      done()
      return
    }
    setTimeout(done, 8_000)
  })
}

export function scheduleStopTorrent(infoHash: string, delayMs = 2_500) {
  const hash = infoHash.toLowerCase()
  cancelScheduledStop(hash)
  const timer = setTimeout(() => {
    getStopTimers().delete(hash)
    void stopTorrent(hash)
  }, delayMs)
  getStopTimers().set(hash, timer)
}

export async function getReadyTorrent(opts: {
  infoHash: string
  magnet?: string
  trackers?: string[]
  fileIdx?: number
  timeoutMs?: number
}) {
  const stored = getSources().get(opts.infoHash.toLowerCase())
  const torrent = startTorrent({
    infoHash: opts.infoHash,
    magnet: opts.magnet ?? stored?.magnet,
    trackers: opts.trackers ?? stored?.trackers ?? [],
    fileIdx: opts.fileIdx ?? stored?.fileIdx,
  })
  return waitReady(torrent, opts.timeoutMs ?? 90_000)
}

export function mimeFromName(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4"
  if (lower.endsWith(".webm")) return "video/webm"
  if (lower.endsWith(".mov")) return "video/quicktime"
  if (lower.endsWith(".mkv")) return "video/x-matroska"
  return "application/octet-stream"
}

export function parseByteRange(header: string | null, size: number) {
  if (!header || !header.startsWith("bytes=")) {
    return { start: 0, end: size - 1, partial: false }
  }
  const [rawStart, rawEnd] = header.slice("bytes=".length).split("-")
  const start = rawStart ? Number(rawStart) : 0
  const end = rawEnd ? Number(rawEnd) : size - 1
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= size || start > end) {
    return { start: 0, end: size - 1, partial: false }
  }
  return { start, end, partial: true }
}

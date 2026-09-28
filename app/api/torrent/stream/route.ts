import {
  getReadyTorrent,
  isInfoHash,
  mimeFromName,
  parseByteRange,
  pickVideoFile,
} from "@/lib/torrent-node"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const url = new URL(request.url)
  const infoHash = url.searchParams.get("hash")?.trim() ?? ""
  const fileIdxRaw = url.searchParams.get("fileIdx")
  const fileIdx = fileIdxRaw ? Number(fileIdxRaw) : undefined
  if (!isInfoHash(infoHash)) {
    return new Response("infoHash inválido", { status: 400 })
  }

  try {
    const torrent = await getReadyTorrent({
      infoHash,
      fileIdx: Number.isInteger(fileIdx) ? fileIdx : undefined,
      timeoutMs: 90_000,
    })
    const file = pickVideoFile(torrent.files, Number.isInteger(fileIdx) ? fileIdx : undefined)
    if (!file) return new Response("Sin archivo de vídeo", { status: 404 })

    file.select(1)
    const { start, end, partial } = parseByteRange(request.headers.get("range"), file.length)
    const stream = file.stream({ start, end })
    request.signal.addEventListener("abort", () => {
      void stream.cancel().catch(() => undefined)
    })
    const headers = new Headers({
      "Content-Type": mimeFromName(file.name),
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Cache-Control": "no-store",
    })
    if (partial) headers.set("Content-Range", `bytes ${start}-${end}/${file.length}`)

    return new Response(stream, { status: partial ? 206 : 200, headers })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "No se pudo leer el torrent", {
      status: 504,
    })
  }
}

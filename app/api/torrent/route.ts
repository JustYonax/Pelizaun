import { peekTorrent, scheduleStopTorrent, startTorrent, isInfoHash, torrentStatus } from "@/lib/torrent-node"
import { stopTranscode } from "@/lib/torrent-transcode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      infoHash?: string
      magnet?: string
      trackers?: string[]
      fileIdx?: number
    }
    const infoHash = body.infoHash?.trim() ?? ""
    if (!isInfoHash(infoHash)) {
      return Response.json({ error: "infoHash inválido" }, { status: 400 })
    }
    const torrent = startTorrent({
      infoHash,
      magnet: body.magnet,
      trackers: Array.isArray(body.trackers) ? body.trackers.slice(0, 30) : [],
      fileIdx: body.fileIdx,
    })
    return Response.json(torrentStatus(torrent, body.fileIdx))
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar el torrent" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const infoHash = url.searchParams.get("hash")?.trim() ?? ""
  const fileIdx = url.searchParams.get("fileIdx")
  if (!isInfoHash(infoHash)) {
    return Response.json({ error: "infoHash inválido" }, { status: 400 })
  }
  const torrent = peekTorrent(infoHash)
  if (!torrent) {
    return Response.json({
      ready: false,
      progress: 0,
      peers: 0,
      downloadSpeed: 0,
      name: null,
      fileName: null,
      fileLength: null,
      playbackUrl: null,
    })
  }
  return Response.json(torrentStatus(torrent, fileIdx ? Number(fileIdx) : undefined))
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const infoHash = url.searchParams.get("hash")?.trim() ?? ""
  if (!isInfoHash(infoHash)) {
    return Response.json({ error: "infoHash inválido" }, { status: 400 })
  }
  stopTranscode(infoHash)
  scheduleStopTorrent(infoHash)
  return Response.json({ ok: true })
}

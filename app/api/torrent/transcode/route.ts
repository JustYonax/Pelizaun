import { startTranscode, transcodeStatus } from "@/lib/torrent-transcode"
import { isInfoHash } from "@/lib/torrent-node"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { infoHash?: string; fileIdx?: number }
    const infoHash = body.infoHash?.trim() ?? ""
    if (!isInfoHash(infoHash)) {
      return Response.json({ error: "infoHash inválido" }, { status: 400 })
    }
    const status = await startTranscode({ infoHash, fileIdx: body.fileIdx })
    return Response.json(status)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo transcodificar" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const infoHash = url.searchParams.get("hash")?.trim() ?? ""
  if (!isInfoHash(infoHash)) {
    return Response.json({ error: "infoHash inválido" }, { status: 400 })
  }
  return Response.json(transcodeStatus(infoHash))
}

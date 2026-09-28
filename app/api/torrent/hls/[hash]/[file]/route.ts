import { readHlsFile } from "@/lib/torrent-transcode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ hash: string; file: string }> },
) {
  const { hash, file } = await context.params
  const payload = readHlsFile(hash, file)
  if (!payload) return new Response("No encontrado", { status: 404 })
  return new Response(payload.body, {
    headers: {
      "Content-Type": payload.contentType,
      "Cache-Control": "no-store",
    },
  })
}

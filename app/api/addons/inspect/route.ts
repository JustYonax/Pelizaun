import { fetchJson, parseManifest, safeHttpsUrl } from "@/lib/addon-server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string }
    const manifestUrl = safeHttpsUrl(body.url ?? "")
    const manifest = parseManifest(await fetchJson(manifestUrl), manifestUrl)
    return Response.json({ manifest, manifestUrl: manifestUrl.toString() })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}

import { fetchJson, inspectAddonManifest, safeHttpsUrl } from "@/lib/addon-server"
import { addonLog } from "@/lib/stremio"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string }
    const manifestUrl = safeHttpsUrl(body.url ?? "")
    const manifest = inspectAddonManifest(await fetchJson(manifestUrl), manifestUrl)
    return Response.json({ manifest, manifestUrl: manifestUrl.toString() })
  } catch (error) {
    addonLog("inspect", "No se pudo validar el addon", error)
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}

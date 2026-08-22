import { fetchJson, safeHttpsUrl } from "@/lib/addon-server"
import { addonLog } from "@/lib/stremio"

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("url") ?? ""
    const url = safeHttpsUrl(raw)
    const data = await fetchJson(url)
    return Response.json({ data })
  } catch (error) {
    addonLog("proxy", "Fallo al consultar el addon", error)
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}

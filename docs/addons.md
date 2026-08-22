# Addons de Pelizaun

Pelizaun combina dos protocolos:

- **Pelizaun**: manifiesto propio con `capabilities` y `endpoints`.
- **Stremio**: manifiesto con `resources`, `types` y rutas `/stream/{type}/{id}.json`.

La búsqueda de títulos usa **TMDB**. Los addons se consultan después, en la ficha y en el reproductor, para resolver fuentes de vídeo.

## Guía para usuarios: instalar un addon

1. Abre **Addons y APIs** en el menú lateral.
2. Pega la URL HTTPS del `manifest.json` (Pelizaun o Stremio).
3. Pulsa **Instalar**. Pelizaun valida el manifiesto en el servidor (evita CORS y direcciones privadas).
4. Activa o desactiva el addon con el interruptor.
5. Ordena con las flechas: el primero de la lista se consulta primero.
6. Si el addon declara `config`, pulsa **Configurar** y guarda. La configuración se guarda solo en este navegador (`localStorage`).
7. **Buscar actualizaciones** compara la versión instalada con la del manifiesto remoto.

### Cómo se reproduce un título

1. Busca la película o serie (el buscador usa TMDB, no el addon).
2. Entra en la ficha. El bloque **Fuentes de addons** lista los streams.
3. Elige una fuente o pulsa **Ver ahora**. El reproductor está en `/ver/{tipo}/{id}`.

### Qué se puede reproducir

- URLs HTTPS de vídeo (mp4, webm, HLS, DASH y enlaces Debrid HTTPS).
- Embeds de YouTube (`ytId`).

Los magnets, `infoHash` y archivos `.torrent` se muestran como no reproducibles. El navegador no hace de cliente BitTorrent: no hay WebTorrent. Si tu proveedor Debrid expone una URL HTTPS, esa sí se reproduce.

### Problemas frecuentes

| Síntoma | Qué hacer |
| --- | --- |
| El addon no instala | Debe ser HTTPS público. Localhost y redes privadas están bloqueados. |
| “Tardó más de 5 segundos” | El addon no respondió a tiempo. Reintenta o desactívalo. |
| No hay fuentes | Comprueba que el addon esté activo, que ofrezca `stream` y que TMDB tenga IMDb (`tt…`) para ese título. |
| CORS | Las peticiones a addons salen del servidor (`/api/addons/inspect`, `/api/streams`, `/api/addons/proxy`). No hace falta proxy en el navegador. |
| HLS no arranca en Chrome | Safari reproduce `.m3u8` nativo. Chrome a menudo necesita un reproductor HLS; Pelizaun usa `<video>` HTML5. |

---

## Guía para desarrolladores: crear un addon compatible

### Manifiesto Pelizaun

```json
{
  "id": "com.ejemplo.streams",
  "name": "Ejemplo Streams",
  "version": "1.0.0",
  "description": "Streams HTTPS de demostración",
  "capabilities": ["streams", "live"],
  "endpoints": {
    "streams": "https://ejemplo.com/api/streams",
    "live": "https://ejemplo.com/api/live"
  }
}
```

`GET` al endpoint de streams recibe:

- `type`: `movie` o `tv`
- `tmdbId`
- `imdbId` (si TMDB lo conoce)
- `season` y `episode` en series

Respuesta aceptada:

```json
{
  "streams": [
    {
      "id": "1",
      "label": "1080p · Español",
      "quality": "1080p",
      "language": "es",
      "url": "https://cdn.ejemplo.com/demo.mp4",
      "details": "Fuente oficial"
    }
  ]
}
```

Solo se aceptan HTTPS con extensión `.mp4`, `.webm`, `.m3u8` o `.mpd`.

### Manifiesto Stremio

```json
{
  "id": "com.ejemplo.stremio",
  "version": "1.0.0",
  "name": "Ejemplo Stremio",
  "description": "Addon compatible con Stremio",
  "resources": ["stream"],
  "types": ["movie", "series"],
  "idPrefixes": ["tt"],
  "catalogs": [],
  "behaviorHints": { "configurable": true },
  "config": [
    { "key": "apiKey", "type": "text", "title": "API key", "required": true }
  ]
}
```

Ruta de streams (protocolo Stremio):

```
GET {base}/stream/movie/tt1375666.json
GET {base}/stream/series/tt0903747:1:5.json
```

`{base}` es la URL del transport (el `manifest.json` sin el archivo). Pelizaun traduce TMDB → IMDb automáticamente.

Respuesta:

```json
{
  "streams": [
    {
      "name": "1080p",
      "title": "Inception\n1080p\n2.1 GB\nEnglish",
      "url": "https://cdn.ejemplo.com/inception.mp4"
    }
  ]
}
```

La configuración se inserta en la ruta al estilo del SDK de Stremio:

```
https://host/{configJsonCodificado}/manifest.json
```

### Requisitos

- HTTPS público (no RFC1918, no localhost).
- JSON de como máximo 2 MB.
- Responder en menos de 5 segundos.
- No devolver magnets si esperas reproducción en Pelizaun; usa URL HTTPS o un resolver Debrid.

---

## Arquitectura (para mantenedores)

```
UI (localStorage, orden, config)
  → /api/addons/inspect   valida manifiesto
  → /api/streams          consulta addons en orden
  → /api/addons/proxy     GET JSON genérico (SSRF-safe)
  → /api/search           TMDB (no streams)
```

| Módulo | Rol |
| --- | --- |
| `lib/addon-protocol.ts` | Persistencia `pelizaun:custom-addons:v1` y tipos unificados |
| `lib/stremio.ts` | Parseo Stremio, URLs `/stream/…`, versiones, calidad |
| `lib/addon-server.ts` | Fetch con timeout, HTTPS, bloqueo SSRF |
| `lib/streams.ts` | Orquesta Pelizaun + Stremio y normaliza a `StreamOption` |
| `lib/tmdb.ts` → `getImdbId` | `tt1375666` desde el ID de TMDB |
| `lib/hooks/useAddons.ts` | Estado de cliente |
| `components/player/Player.tsx` | `<video>` HTML5 + embed YouTube |

El orden del array en `localStorage` es la prioridad. `/api/streams` recibe las URLs en ese orden y concatena resultados (mejor calidad dentro de cada addon).

Logs de depuración: `[pelizaun:inspect]`, `[pelizaun:addon]`, `[pelizaun:proxy]` en la consola del servidor.

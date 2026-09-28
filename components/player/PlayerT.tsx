"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Radio } from "lucide-react"
import type { StreamOption } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import { PlayerPlaceholder } from "@/components/player/player-placeholder"

type TorrentStatus = {
  ready?: boolean
  progress?: number
  peers?: number
  downloadSpeed?: number
  fileName?: string | null
  playbackUrl?: string | null
  error?: string
}

type TranscodeStatus = {
  converting?: boolean
  ready?: boolean
  playlist?: string | null
  error?: string | null
}

function needsHls(fileName: string | null | undefined) {
  if (!fileName) return true
  return !/\.(mp4|m4v|webm)$/i.test(fileName)
}

function formatSpeed(bytes: number) {
  if (bytes < 1024) return `${Math.round(bytes)} B/s`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`
}

function safePlay(video: HTMLVideoElement) {
  const play = video.play()
  if (play && typeof play.catch === "function") {
    void play.catch((error: unknown) => {
      const name = error instanceof Error ? error.name : ""
      if (name === "AbortError" || name === "NotAllowedError") return
    })
  }
}

function stopTorrentOnServer(hash: string) {
  const params = new URLSearchParams({ hash })
  void fetch(`/api/torrent?${params}`, { method: "DELETE", keepalive: true }).catch(() => undefined)
}

function streamUrl(stream: StreamOption) {
  const params = new URLSearchParams({ hash: stream.infoHash ?? "" })
  if (typeof stream.fileIdx === "number") params.set("fileIdx", String(stream.fileIdx))
  return `/api/torrent/stream?${params}`
}

export function PlayerT({
  stream,
  title,
}: {
  stream: StreamOption
  title: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState("Conectando al swarm en el servidor…")
  const [progress, setProgress] = useState(0)
  const [peers, setPeers] = useState(0)
  const [speed, setSpeed] = useState("0 B/s")
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const trackerKey = stream.trackers?.join("|") ?? ""

  useEffect(() => {
    if (!mounted) return
    const video = videoRef.current
    const hash = stream.infoHash
    if (!video || !hash) {
      setError("Este origen no incluye infoHash.")
      return
    }

    let cancelled = false
    let attached = false
    let hlsAttached = false
    let wantHls = false
    let hls: Hls | null = null
    let pictureTimer: number | undefined
    let fileName: string | null = null
    setReady(false)
    setError(null)
    setProgress(0)
    setPeers(0)
    setStatus("Buscando peers en el servidor…")

    const applyTorrent = (payload: TorrentStatus) => {
      setProgress(payload.progress ?? 0)
      setPeers(payload.peers ?? 0)
      setSpeed(formatSpeed(payload.downloadSpeed ?? 0))
      if (payload.fileName) fileName = payload.fileName
    }

    const markReady = () => {
      if (cancelled) return
      setReady(true)
      safePlay(video)
    }

    const attachNative = (url: string) => {
      video.src = url
      video.load()
    }

    const attachHls = (playlist: string) => {
      if (hlsAttached || cancelled) return
      hlsAttached = true
      video.removeAttribute("src")
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 })
        hls.loadSource(playlist)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, markReady)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled || !data.fatal) return
          setError(data.details || "No se pudo reproducir el HLS.")
        })
        return
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        attachNative(playlist)
      }
    }

    const startHls = async () => {
      setStatus("Convirtiendo a H.264 para el navegador…")
      const started = await fetch("/api/torrent/transcode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ infoHash: hash, fileIdx: stream.fileIdx }),
      })
      const body = (await started.json()) as TranscodeStatus & { error?: string }
      if (!started.ok) throw new Error(body.error ?? "No se pudo transcodificar")
    }

    const maybeAttach = (payload: TorrentStatus) => {
      if (attached || cancelled || !payload.ready) return
      attached = true
      video.addEventListener("playing", markReady)
      video.addEventListener("canplay", markReady)
      if (needsHls(payload.fileName)) {
        wantHls = true
        setStatus(`Convirtiendo ${payload.fileName ?? "el vídeo"} a H.264…`)
        void startHls().catch((caught) => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo transcodificar")
        })
        return
      }
      setStatus(`Listo: ${payload.fileName}`)
      attachNative(streamUrl(stream))
      pictureTimer = window.setTimeout(() => {
        if (cancelled || hlsAttached || video.videoWidth >= 2) return
        wantHls = true
        setStatus("Chrome no pinta este códec. Convirtiendo a H.264…")
        void startHls().catch((caught) => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo transcodificar")
        })
      }, 2000)
    }

    const start = async () => {
      const started = await fetch("/api/torrent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          infoHash: hash,
          magnet: stream.magnet,
          trackers: stream.trackers ?? [],
          fileIdx: stream.fileIdx,
        }),
      })
      const startedBody = (await started.json()) as TorrentStatus & { error?: string }
      if (!started.ok) throw new Error(startedBody.error ?? "No se pudo iniciar el torrent")
      if (cancelled) return
      applyTorrent(startedBody)
      maybeAttach(startedBody)
    }

    const poll = window.setInterval(async () => {
      try {
        const params = new URLSearchParams({ hash })
        if (typeof stream.fileIdx === "number") params.set("fileIdx", String(stream.fileIdx))
        const torrentRes = await fetch(`/api/torrent?${params}`)
        const torrentPayload = (await torrentRes.json()) as TorrentStatus
        if (cancelled) return
        applyTorrent(torrentPayload)
        maybeAttach(torrentPayload)

        if (wantHls || needsHls(fileName) || needsHls(torrentPayload.fileName)) {
          const transRes = await fetch(`/api/torrent/transcode?${new URLSearchParams({ hash })}`)
          const trans = (await transRes.json()) as TranscodeStatus
          if (cancelled) return
          if (trans.error) {
            setError(trans.error)
            return
          }
          if (trans.ready && trans.playlist) {
            setStatus("Reproduciendo H.264")
            attachHls(trans.playlist)
          }
        }
      } catch {
        // El poll reintenta.
      }
    }, 1500)

    void start().catch((caught) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo iniciar el torrent")
    })

    const timeout = window.setTimeout(() => {
      if (cancelled || video.readyState >= 2) return
      setError("Sigue sin arrancar. Prueba otra fuente de la lista.")
    }, 120_000)

    const onPageHide = () => {
      stopTorrentOnServer(hash)
    }
    window.addEventListener("pagehide", onPageHide)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearTimeout(timeout)
      window.clearTimeout(pictureTimer)
      window.removeEventListener("pagehide", onPageHide)
      hls?.destroy()
      video.removeAttribute("src")
      video.load()
      stopTorrentOnServer(hash)
    }
  }, [mounted, stream.id, stream.infoHash, stream.magnet, stream.fileIdx, trackerKey])

  if (!mounted) {
    return <PlayerPlaceholder message="Cargando reproductor torrent…" />
  }

  return (
    <div className="ring-border/60 relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1">
      <video ref={videoRef} controls playsInline className="relative z-0 size-full object-contain" />
      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
          <Radio className="text-muted-foreground size-8" />
          <p className="text-destructive max-w-sm text-sm">{error}</p>
        </div>
      ) : null}
      {!ready && !error ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-14 z-10 flex flex-col items-center justify-center gap-3 bg-black/40 p-6 text-center">
          <Spinner className="size-8" />
          <p className="text-muted-foreground max-w-sm text-sm">{status}</p>
          <p className="text-muted-foreground text-xs">
            {progress}% · {peers} peers · {speed}
          </p>
          <p className="text-muted-foreground max-w-sm text-[11px]">
            MKV/HEVC se convierte a H.264 en tu PC con FFmpeg y se reproduce con hls.js.
          </p>
        </div>
      ) : null}
      {ready && !error ? (
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1">
          <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold">
            Torrent · {stream.provider} · {stream.quality}
            {stream.size ? ` · ${stream.size}` : ""}
          </span>
          <span className="glass rounded-full px-3 py-1 text-[11px]">
            {title} · {progress}% · {peers} peers · {speed}
          </span>
        </div>
      ) : null}
    </div>
  )
}

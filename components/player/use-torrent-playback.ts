"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import Hls from "hls.js"
import type { StreamOption } from "@/lib/types"

type TorrentStatus = {
  ready?: boolean
  progress?: number
  peers?: number
  downloadSpeed?: number
  fileName?: string | null
  error?: string
}

type TranscodeStatus = {
  converting?: boolean
  ready?: boolean
  playlist?: string | null
  error?: string | null
}

export type TorrentPlayback = {
  status: string
  progress: number
  peers: number
  speed: string
  error: string | null
  ready: boolean
  hasPicture: boolean
  transcoding: boolean
  requestTranscode: () => void
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

export function useTorrentPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  stream: StreamOption | null,
) {
  const [status, setStatus] = useState("Buscando peers…")
  const [progress, setProgress] = useState(0)
  const [peers, setPeers] = useState(0)
  const [speed, setSpeed] = useState("0 B/s")
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [hasPicture, setHasPicture] = useState(true)
  const [transcoding, setTranscoding] = useState(false)
  const [transcodeRequested, setTranscodeRequested] = useState(false)
  const enabled = stream?.kind === "torrent"
  const trackerKey = stream?.trackers?.join("|") ?? ""
  const hash = stream?.infoHash ?? ""

  const requestTranscode = useCallback(() => {
    setTranscodeRequested(true)
  }, [])

  useEffect(() => {
    setTranscodeRequested(false)
    setTranscoding(false)
    setHasPicture(true)
  }, [stream?.id, hash])

  useEffect(() => {
    if (!enabled || !stream) {
      setReady(false)
      setError(null)
      return
    }
    const video = videoRef.current
    if (!video || !hash) {
      setError("Este origen no incluye infoHash.")
      return
    }

    let cancelled = false
    let attached = false
    let pictureTimer: number | undefined
    setReady(false)
    setError(null)
    setProgress(0)
    setPeers(0)
    setStatus("Buscando peers con WebTorrent…")

    const applyTorrent = (payload: TorrentStatus) => {
      setProgress(payload.progress ?? 0)
      setPeers(payload.peers ?? 0)
      setSpeed(formatSpeed(payload.downloadSpeed ?? 0))
    }

    const markReady = () => {
      if (cancelled) return
      setReady(true)
      safePlay(video)
      window.clearTimeout(pictureTimer)
      pictureTimer = window.setTimeout(() => {
        if (cancelled) return
        setHasPicture(video.videoWidth >= 2)
      }, 1800)
    }

    const attachNative = () => {
      if (attached || cancelled) return
      attached = true
      video.addEventListener("playing", markReady)
      video.addEventListener("canplay", markReady)
      video.src = streamUrl(stream)
      video.load()
      setStatus("Reproduciendo con WebTorrent")
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
      if (startedBody.ready) attachNative()
    }

    const poll = window.setInterval(async () => {
      try {
        const params = new URLSearchParams({ hash })
        if (typeof stream.fileIdx === "number") params.set("fileIdx", String(stream.fileIdx))
        const torrentRes = await fetch(`/api/torrent?${params}`)
        const torrentPayload = (await torrentRes.json()) as TorrentStatus
        if (cancelled) return
        applyTorrent(torrentPayload)
        if (torrentPayload.ready) attachNative()
      } catch {
        // El poll reintenta.
      }
    }, 1500)

    void start().catch((caught) => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo iniciar el torrent")
    })

    const timeout = window.setTimeout(() => {
      if (cancelled || video.readyState >= 2) return
      setError("Sigue sin arrancar. Prueba otra fuente.")
    }, 90_000)

    const onPageHide = () => stopTorrentOnServer(hash)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.clearTimeout(timeout)
      window.clearTimeout(pictureTimer)
      window.removeEventListener("pagehide", onPageHide)
      video.removeAttribute("src")
      video.load()
      stopTorrentOnServer(hash)
    }
  }, [enabled, hash, stream?.id, stream?.magnet, stream?.fileIdx, trackerKey, videoRef])

  useEffect(() => {
    if (!transcodeRequested || !enabled || !hash) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let hls: Hls | null = null
    setTranscoding(true)
    setStatus("Convirtiendo a H.264…")

    const attachHls = (playlist: string) => {
      if (cancelled) return
      video.removeAttribute("src")
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 12 })
        hls.loadSource(playlist)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setReady(true)
          setHasPicture(true)
          setTranscoding(false)
          setStatus("Reproduciendo H.264")
          safePlay(video)
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled || !data.fatal) return
          setTranscoding(false)
          setError(data.details || "No se pudo reproducir el HLS.")
        })
        return
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playlist
        video.load()
      }
    }

    const start = async () => {
      const started = await fetch("/api/torrent/transcode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ infoHash: hash, fileIdx: stream?.fileIdx }),
      })
      const body = (await started.json()) as TranscodeStatus & { error?: string }
      if (!started.ok) throw new Error(body.error ?? "No se pudo transcodificar")
    }

    const poll = window.setInterval(async () => {
      try {
        const transRes = await fetch(`/api/torrent/transcode?${new URLSearchParams({ hash })}`)
        const trans = (await transRes.json()) as TranscodeStatus
        if (cancelled) return
        if (trans.error) {
          setTranscoding(false)
          setError(trans.error)
          return
        }
        if (trans.ready && trans.playlist) attachHls(trans.playlist)
      } catch {
        // El poll reintenta.
      }
    }, 1500)

    void start().catch((caught) => {
      if (cancelled) return
      setTranscoding(false)
      setError(caught instanceof Error ? caught.message : "No se pudo transcodificar")
    })

    return () => {
      cancelled = true
      window.clearInterval(poll)
      hls?.destroy()
    }
  }, [transcodeRequested, enabled, hash, stream?.fileIdx, videoRef])

  return {
    status,
    progress,
    peers,
    speed,
    error,
    ready,
    hasPicture,
    transcoding,
    requestTranscode,
  } satisfies TorrentPlayback
}

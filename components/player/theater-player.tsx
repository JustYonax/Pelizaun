"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Layers,
  ListVideo,
  Maximize,
  Minimize,
  Pause,
  Play,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import type { StreamOption } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { useTorrentPlayback } from "@/components/player/use-torrent-playback"

type TheaterPanel = "none" | "sources" | "episodes"

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const hrs = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hrs) return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  return `${mins}:${String(secs).padStart(2, "0")}`
}

function streamKind(stream: StreamOption | null) {
  return stream?.kind ?? "unavailable"
}

function isEmbed(stream: StreamOption | null) {
  return Boolean(
    stream &&
      (stream.kind === "embed" || stream.url.includes("youtube-nocookie.com/embed/")),
  )
}

export function TheaterPlayer({
  title,
  subtitle,
  backHref,
  stream,
  streams,
  streamsLoading,
  onSelectStream,
  warning,
  episodePanel,
}: {
  title: string
  subtitle?: string
  backHref: string
  stream: StreamOption | null
  streams: StreamOption[]
  streamsLoading: boolean
  onSelectStream: (id: string) => void
  warning?: string | null
  episodePanel?: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const torrent = useTorrentPlayback(videoRef, stream)
  const [panel, setPanel] = useState<TheaterPanel>("none")
  const [showUi, setShowUi] = useState(true)
  const [paused, setPaused] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const kind = streamKind(stream)
  const embed = isEmbed(stream)
  const hasVideo = kind === "http" || kind === "torrent"
  const buffering = kind === "torrent" && !torrent.ready && !torrent.error && !torrent.transcoding
  const converting = kind === "torrent" && torrent.transcoding

  const bumpUi = useCallback(() => {
    setShowUi(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      setShowUi(false)
    }, 2800)
  }, [])

  useEffect(() => {
    if (panel !== "none") {
      window.clearTimeout(hideTimer.current)
      setShowUi(true)
      return
    }
    bumpUi()
    return () => window.clearTimeout(hideTimer.current)
  }, [panel, bumpUi])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || kind !== "http" || !stream?.url) return
    video.src = stream.url
    video.load()
    const play = video.play()
    if (play) void play.catch(() => undefined)
    return () => {
      video.removeAttribute("src")
      video.load()
    }
  }, [kind, stream?.id, stream?.url])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      setCurrentTime(video.currentTime)
      setDuration(video.duration || 0)
      setPaused(video.paused)
    }
    const onPlay = () => setPaused(false)
    const onPause = () => setPaused(true)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("durationchange", onTime)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    return () => {
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("durationchange", onTime)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
    }
  }, [stream?.id])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || embed) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
    bumpUi()
  }

  const toggleFullscreen = async () => {
    const root = rootRef.current
    if (!root) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await root.requestFullscreen()
    } catch {
      // El navegador puede bloquear fullscreen si no hay gesto.
    }
    bumpUi()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    bumpUi()
  }

  const uiVisible = showUi || panel !== "none" || paused || buffering || converting || Boolean(torrent.error)
  const error = kind === "torrent" ? torrent.error : null

  const renderPanel = () => {
    switch (panel) {
      case "none":
        return null
      case "sources":
        return (
          <SourcesPanel
            streams={streams}
            selectedId={stream?.id}
            loading={streamsLoading}
            warning={warning}
            onSelect={(id) => {
              onSelectStream(id)
              setPanel("none")
              const root = rootRef.current
              if (root && !document.fullscreenElement) {
                void root.requestFullscreen().catch(() => undefined)
              }
            }}
          />
        )
      case "episodes":
        return episodePanel
      default: {
        const exhaustive: never = panel
        return exhaustive
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative isolate h-[min(92dvh,calc(100dvh-4.5rem))] w-full overflow-hidden bg-black text-white"
      onMouseMove={bumpUi}
      onMouseLeave={() => {
        if (panel === "none" && !paused) setShowUi(false)
      }}
    >
      {embed && stream ? (
        <iframe
          src={stream.url}
          title={`Reproduciendo ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          className="absolute inset-0 size-full object-contain"
          onClick={togglePlay}
          onDoubleClick={() => void toggleFullscreen()}
        />
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/55 transition-opacity duration-300",
          uiVisible ? "opacity-100" : "opacity-0",
        )}
      />

      {converting ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
          <Spinner className="size-8 text-white" />
          <p className="max-w-sm text-sm text-white/80">{torrent.status}</p>
          <p className="text-xs text-white/50">Esto usa más RAM. Puedes dejarlo y elegir una fuente mp4/h264.</p>
        </div>
      ) : null}

      {buffering ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
          <Spinner className="size-8 text-white" />
          <p className="max-w-sm text-sm text-white/80">{torrent.status}</p>
          <p className="text-xs text-white/50">
            {torrent.progress}% · {torrent.peers} peers · {torrent.speed}
          </p>
        </div>
      ) : null}

      {kind === "torrent" && torrent.ready && !torrent.hasPicture && !torrent.transcoding && !error ? (
        <div className="absolute inset-x-4 bottom-24 z-20 mx-auto flex max-w-lg flex-col gap-2 rounded-2xl bg-black/80 px-4 py-3 text-left">
          <p className="text-sm text-white/90">
            WebTorrent está reproduciendo, pero Chrome no pinta este códec (suele ser HEVC/MKV). Se oye el
            audio.
          </p>
          <button
            type="button"
            onClick={() => torrent.requestTranscode()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-white/90"
          >
            <Sparkles className="size-4" />
            Convertir a H.264
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Radio className="size-8 text-white/70" />
          <p className="text-destructive max-w-sm text-sm">{error}</p>
        </div>
      ) : null}

      {!stream && !streamsLoading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Radio className="size-8 text-white/70" />
          <p className="max-w-sm text-sm text-white/70">No hay una fuente disponible.</p>
        </div>
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300",
          uiVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <div className={cn("flex items-start justify-between gap-3 p-4 sm:p-6", uiVisible && "pointer-events-auto")}>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium backdrop-blur-md hover:bg-black/60"
          >
            <ChevronLeft className="size-4" />
            Volver
          </Link>
          <div className="min-w-0 text-right">
            <p className="truncate text-base font-semibold sm:text-lg">{title}</p>
            {subtitle ? <p className="truncate text-xs text-white/60">{subtitle}</p> : null}
          </div>
        </div>

        <div className={cn("flex flex-col gap-3 p-4 sm:p-6", uiVisible && "pointer-events-auto")}>
          {hasVideo && !embed ? (
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Number.isFinite(currentTime) ? currentTime : 0}
              onChange={(event) => {
                const video = videoRef.current
                if (!video) return
                video.currentTime = Number(event.target.value)
                setCurrentTime(video.currentTime)
              }}
              className="accent-primary h-1 w-full cursor-pointer"
            />
          ) : null}

          <div className="flex items-center gap-2 sm:gap-3">
            {hasVideo && !embed ? (
              <button
                type="button"
                onClick={togglePlay}
                className="rounded-full p-2 hover:bg-white/10"
                aria-label={paused ? "Reproducir" : "Pausar"}
              >
                {paused ? <Play className="size-7 fill-current" /> : <Pause className="size-7 fill-current" />}
              </button>
            ) : null}

            {hasVideo && !embed ? (
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full p-2 hover:bg-white/10"
                aria-label={muted ? "Activar sonido" : "Silenciar"}
              >
                {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            ) : null}

            {hasVideo && !embed ? (
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  const video = videoRef.current
                  if (!video) return
                  const next = Number(event.target.value)
                  video.volume = next
                  video.muted = next === 0
                  setVolume(next)
                  setMuted(next === 0)
                }}
                className="accent-primary hidden h-1 w-24 cursor-pointer sm:block"
              />
            ) : null}

            {hasVideo && !embed ? (
              <span className="text-xs text-white/70 tabular-nums">
                {formatClock(currentTime)} / {formatClock(duration)}
              </span>
            ) : null}

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPanel(panel === "sources" ? "none" : "sources")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm hover:bg-white/10",
                  panel === "sources" ? "bg-white/15" : "",
                )}
              >
                <Layers className="size-4" />
                <span className="hidden sm:inline">Fuentes</span>
              </button>
              {episodePanel ? (
                <button
                  type="button"
                  onClick={() => setPanel(panel === "episodes" ? "none" : "episodes")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm hover:bg-white/10",
                    panel === "episodes" ? "bg-white/15" : "",
                  )}
                >
                  <ListVideo className="size-4" />
                  <span className="hidden sm:inline">Episodios</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="rounded-full p-2 hover:bg-white/10"
                aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {panel !== "none" ? (
        <aside className="absolute inset-y-0 right-0 z-30 flex w-[min(100%,380px)] flex-col bg-black/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold">
              {panel === "sources" ? "Fuentes" : "Episodios"}
            </p>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="rounded-full p-1.5 hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">{renderPanel()}</div>
        </aside>
      ) : null}
    </div>
  )
}

function SourcesPanel({
  streams,
  selectedId,
  loading,
  warning,
  onSelect,
}: {
  streams: StreamOption[]
  selectedId?: string
  loading: boolean
  warning?: string | null
  onSelect: (id: string) => void
}) {
  if (loading) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 px-2 py-8 text-sm">
        <Spinner />
        Buscando fuentes…
      </p>
    )
  }
  if (!streams.length) {
    return <p className="px-2 py-8 text-sm text-white/60">No hay streams para esta selección.</p>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {streams.map((item) => {
        const active = item.id === selectedId
        const disabled = item.playable === false
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors",
              active ? "bg-white/15 ring-1 ring-white/30" : "hover:bg-white/8",
              disabled ? "cursor-not-allowed opacity-50" : "",
            )}
          >
            <span className="text-sm font-semibold">
              {item.quality}
              {item.size ? ` · ${item.size}` : ""}
              {item.language ? ` · ${item.language.toUpperCase()}` : ""}
            </span>
            <span className="truncate text-xs text-white/55">{item.provider}</span>
            <span className="truncate text-[11px] text-white/40">{item.label}</span>
          </button>
        )
      })}
      {warning ? <p className="text-[var(--warning)] px-2 pt-2 text-xs">{warning}</p> : null}
    </div>
  )
}

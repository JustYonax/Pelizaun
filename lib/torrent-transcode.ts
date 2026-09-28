import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import ffmpegPath from "ffmpeg-static"
import { getReadyTorrent, isInfoHash, torrentStatus } from "@/lib/torrent-node"

type TranscodeJob = {
  hash: string
  process: ChildProcessWithoutNullStreams
  dir: string
  startedAt: number
  error: string | null
  logs: string[]
}

const globalForTranscode = globalThis as unknown as {
  pelizaunTranscodes?: Map<string, TranscodeJob>
}

function jobs() {
  if (!globalForTranscode.pelizaunTranscodes) {
    globalForTranscode.pelizaunTranscodes = new Map()
  }
  return globalForTranscode.pelizaunTranscodes
}

function hlsDir(hash: string) {
  return path.join(os.tmpdir(), "pelizaun-hls", hash)
}

export function needsTranscode(fileName: string | null | undefined) {
  if (!fileName) return true
  return !/\.(mp4|m4v|webm)$/i.test(fileName)
}

export function hlsPlaylistUrl(hash: string) {
  return `/api/torrent/hls/${hash}/index.m3u8`
}

export function transcodeStatus(hash: string) {
  const job = jobs().get(hash.toLowerCase())
  const dir = hlsDir(hash.toLowerCase())
  const indexPath = path.join(dir, "index.m3u8")
  const ready = fs.existsSync(indexPath) && fs.readdirSync(dir).some((file) => file.endsWith(".ts"))
  return {
    converting: Boolean(job && job.process.exitCode === null && !job.error),
    ready,
    error: job?.error ?? null,
    playlist: ready ? hlsPlaylistUrl(hash.toLowerCase()) : null,
  }
}

export function stopTranscode(infoHash: string) {
  const hash = infoHash.toLowerCase()
  const job = jobs().get(hash)
  if (job) {
    try {
      job.process.kill()
    } catch {
      // El proceso ya pudo haber cerrado.
    }
    jobs().delete(hash)
  }
  fs.rmSync(hlsDir(hash), { recursive: true, force: true })
}

function stopOtherTranscodes(keepHash: string) {
  for (const hash of jobs().keys()) {
    if (hash !== keepHash) stopTranscode(hash)
  }
}

function ffmpegArgs(input: string) {
  return [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    "-threads",
    "1",
    "-filter_threads",
    "1",
    "-fflags",
    "+nobuffer+discardcorrupt",
    "-flags",
    "low_delay",
    "-probesize",
    "512k",
    "-analyzeduration",
    "1M",
    "-thread_queue_size",
    "64",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_on_network_error",
    "1",
    "-rw_timeout",
    "30000000",
    "-i",
    input,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-sn",
    "-vf",
    "scale=-2:'min(720,ih)'",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "28",
    "-g",
    "48",
    "-bf",
    "0",
    "-refs",
    "1",
    "-x264-params",
    "frame-threads=1:sliced-threads=1:sync-lookahead=0:rc-lookahead=0:bframes=0:ref=1:scenecut=0",
    "-max_muxing_queue_size",
    "256",
    "-c:a",
    "aac",
    "-ac",
    "2",
    "-b:a",
    "96k",
    "-f",
    "hls",
    "-hls_time",
    "4",
    "-hls_list_size",
    "3",
    "-hls_flags",
    "delete_segments+independent_segments",
    "-hls_segment_filename",
    "seg%05d.ts",
    "index.m3u8",
  ]
}

function ffmpegBinary() {
  const imported = ffmpegPath as unknown as string | { default?: string }
  const binary = typeof imported === "string" ? imported : imported.default
  if (!binary) throw new Error("FFmpeg no está instalado (ffmpeg-static)")
  return binary
}

function appendLog(job: TranscodeJob, chunk: string) {
  job.logs.push(chunk)
  if (job.logs.length > 40) job.logs.splice(0, job.logs.length - 40)
  const text = chunk.toLowerCase()
  if (text.includes("error") || text.includes("invalid") || text.includes("failed")) {
    const line = chunk.trim().split("\n").at(-1)
    if (line) job.error = line.slice(0, 240)
  }
}

export async function startTranscode(opts: { infoHash: string; fileIdx?: number }) {
  if (!isInfoHash(opts.infoHash)) throw new Error("infoHash inválido")
  const hash = opts.infoHash.toLowerCase()
  const previous = jobs().get(hash)
  if (previous?.error) stopTranscode(hash)
  const existing = transcodeStatus(hash)
  if (existing.ready || existing.converting) return existing

  const torrent = await getReadyTorrent({
    infoHash: hash,
    fileIdx: opts.fileIdx,
    timeoutMs: 90_000,
  })
  const status = torrentStatus(torrent, opts.fileIdx)
  const input = status.playbackUrl
  if (!input) throw new Error("El servidor torrent aún no tiene URL de lectura")

  const dir = hlsDir(hash)
  stopOtherTranscodes(hash)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })

  const child = spawn(ffmpegBinary(), ffmpegArgs(input), {
    cwd: dir,
    windowsHide: true,
    stdio: ["ignore", "ignore", "pipe"],
  })

  const job: TranscodeJob = {
    hash,
    process: child,
    dir,
    startedAt: Date.now(),
    error: null,
    logs: [],
  }
  jobs().set(hash, job)

  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk: string) => appendLog(job, chunk))
  child.on("exit", (code) => {
    if (code && code !== 0 && !transcodeStatus(hash).ready) {
      job.error = job.error ?? `FFmpeg salió con código ${code}`
    }
  })
  child.on("error", (error) => {
    job.error = error.message
  })

  return transcodeStatus(hash)
}

const HLS_FILE = /^(index\.m3u8|seg\d+\.ts)$/

export function readHlsFile(infoHash: string, fileName: string) {
  if (!isInfoHash(infoHash) || !HLS_FILE.test(fileName)) return null
  const dir = path.resolve(hlsDir(infoHash.toLowerCase()))
  const filePath = path.resolve(dir, fileName)
  if (!filePath.startsWith(dir + path.sep)) return null
  if (!fs.existsSync(filePath)) return null
  return {
    body: fs.readFileSync(filePath),
    contentType: fileName.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t",
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "webtorrent",
    "bittorrent-dht",
    "ut_pex",
    "@silentbot1/nat-api",
    "fs-chunk-store",
    "ffmpeg-static",
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), autoplay=(self)',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "img-src 'self' data: https:",
              "media-src 'self' https: blob: http://127.0.0.1:*",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
              "worker-src 'self' blob:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https: wss: blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

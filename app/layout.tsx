import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const _inter = Inter({ subsets: ['latin'], display: 'swap' })
const _sora = Sora({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: 'PelisZaun — Streaming y descubrimiento',
    template: '%s · PelisZaun',
  },
  description:
    'PelisZaun es una plataforma premium de streaming y descubrimiento de películas y series: catálogos, trailers, subtítulos y addons en una sola interfaz.',
  generator: 'v0.app',
  applicationName: 'PelisZaun',
  keywords: ['streaming', 'películas', 'series', 'catálogo', 'trailers', 'addons'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0B0F19',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark bg-background">
      <body className="bg-background text-foreground antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

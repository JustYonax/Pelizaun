import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ClientHydration } from '@/components/client-hydration'
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
    <html lang="es" className="dark bg-background" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var a=["bis_skin_checked","bis_register"];function s(r){if(!r||r.nodeType!==1)return;a.forEach(function(n){if(r.hasAttribute&&r.hasAttribute(n))r.removeAttribute(n);r.querySelectorAll&&r.querySelectorAll("["+n+"]").forEach(function(e){e.removeAttribute(n)})})}s(document.documentElement);new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==="attributes"&&a.indexOf(m.attributeName)>=0){m.target.removeAttribute(m.attributeName)}else if(m.addedNodes){m.addedNodes.forEach(s)}})}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:a})})();`,
          }}
        />
        <ClientHydration />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { InventoryProvider } from '../lib/store'
import { ThemeProvider } from '../lib/theme-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Premier Adverts | Traffic System',
  description: 'Digital advertising trafficking system for Premier.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <InventoryProvider>
            {children}
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

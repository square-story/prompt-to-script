import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'
import { Providers } from '@/app/providers'

export const metadata: Metadata = {
  title: 'Creeto AI Mini',
  description: 'Prompt → Research → Script in one flow.',
}

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout


import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GrantoLayout } from '@/components/granto-layout'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Granto - Assistant Subventions',
  description: 'Gérez vos projets et subventions publiques',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <GrantoLayout>
          {children}
        </GrantoLayout>
      </body>
    </html>
  )
}

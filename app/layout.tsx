import React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GrantoLayout } from '@/components/granto-layout'
import './globals.css'

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

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
      <body className={`${geist.className} ${geistMono.className}`}>
        <GrantoLayout>
          {children}
        </GrantoLayout>
      </body>
    </html>
  )
}

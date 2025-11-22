import type { Metadata } from 'next'
import { Alexandria } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from "next-auth/react"
import './globals.css'
import { Providers } from "./provider"

const alexandria = Alexandria({ 
  subsets: ['latin', 'arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: 'Shaddad Sales Panel',
  description: 'تتبع الأنشطة اليومية وإدارة العملاء المؤهلين ومراقبة درجات KPI لفريق المبيعات الخاص بك',
  generator: 'v0.app',
}
//asd
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.className} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

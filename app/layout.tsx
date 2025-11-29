import type React from "react"
import type { Metadata } from "next"
import { Kanit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
})

export const metadata: Metadata = {
  title: "Spotify Playlist Generator | สร้าง Playlist ของคุณ",
  description: "เลือก 12 เพลงจาก Spotify และสร้างเป็นภาพสวยๆ",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { Lora, DM_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const lora = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Mozhi - Learn Without Limits",
  description: "Online course learning platform - learn from expert instructors",
  keywords: ["courses", "learning", "education", "online courses", "video lessons"],
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.png", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icons/icon-512x512.png", sizes: "512x512" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

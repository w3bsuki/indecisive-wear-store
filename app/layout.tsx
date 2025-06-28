import { Sora } from "next/font/google"
import type { Metadata } from "next"
import "./globals.css"

const sora = Sora({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Indecisive Wear",
  description: "For the beautifully undecided.",
  generator: "v0.dev",
}

import { CartProvider } from "@/hooks/use-cart.tsx"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={sora.className}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}

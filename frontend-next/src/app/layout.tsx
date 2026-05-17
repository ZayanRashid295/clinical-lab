import "../index.css"

import { APP_DISPLAY_NAME } from "./config/brand"

export const metadata = {
  title: APP_DISPLAY_NAME,
  description: "AI-powered clinical education and case practice",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

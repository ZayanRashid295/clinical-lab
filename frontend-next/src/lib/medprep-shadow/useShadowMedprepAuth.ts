"use client"

import { useEffect, useState } from "react"
import { authService } from "@/shared/services/auth.service"

type ShadowUser = { id: string; email?: string; name?: string }

export function useShadowMedprepAuth(): {
  isAuthenticated: boolean
  user: ShadowUser | null
} {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<ShadowUser | null>(null)

  useEffect(() => {
    const sync = () => {
      const raw = authService.getCurrentUser() as Record<string, unknown> | null
      if (!raw) {
        setIsAuthenticated(false)
        setUser(null)
        return
      }
      const id = String(raw.id ?? raw.userId ?? "")
      if (!id) {
        setIsAuthenticated(false)
        setUser(null)
        return
      }
      setIsAuthenticated(true)
      setUser({
        id,
        email: typeof raw.email === "string" ? raw.email : undefined,
        name: typeof raw.name === "string" ? raw.name : undefined,
      })
    }
    sync()
    const t = window.setInterval(sync, 4000)
    return () => window.clearInterval(t)
  }, [])

  return { isAuthenticated, user }
}

"use client"

import { useEffect, useState, useContext } from "react"
import { UIConfigContext } from "@/shared/contexts/UIConfigContext"
import { UIConfigService } from "@/app/config/ui.config"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/utils/cn"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const uiConfigContext = useContext(UIConfigContext)

  // Fallback to direct service if context is not available (e.g., outside provider)
  const themeService = uiConfigContext ? null : UIConfigService.getInstance()
  const currentTheme = uiConfigContext?.config.theme || themeService?.getConfig().theme || "light"

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    if (uiConfigContext) {
      uiConfigContext.setTheme(newTheme)
    } else if (themeService) {
      themeService.setTheme(newTheme)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg border border-border/30 dark:border-gray-700 hover:bg-card/50 dark:hover:bg-gray-700/50 transition-all duration-300 text-foreground/70 dark:text-gray-100 hover:text-foreground dark:hover:text-gray-100"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}

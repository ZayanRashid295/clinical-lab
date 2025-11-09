"use client"

import { useRouter } from "next/router"
import AdminDashboard from "./admin-dashboard"
import { ThemeToggle } from "./theme-toggle"

export default function QuestionGeneratorAdmin() {
  const router = useRouter()

  const handleBackClick = () => {
    router.push("/question-generator")
  }

  const handleStudentClick = () => {
    router.push("/question-generator/student")
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleBackClick}
            className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base"
          >
            ← Back to Home
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-foreground whitespace-nowrap">Admin Mode</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStudentClick}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Test View →
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <AdminDashboard />
    </div>
  )
}


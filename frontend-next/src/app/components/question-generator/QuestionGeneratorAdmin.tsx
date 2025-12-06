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
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/20">
      <div className="flex-shrink-0 z-40 bg-card/95 dark:bg-gray-800/95 backdrop-blur border-b border-border dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 w-full">
          <button
            onClick={handleBackClick}
            className="font-bold text-foreground dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors text-sm sm:text-base"
          >
            ← Back to Home
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-foreground dark:text-gray-100 whitespace-nowrap">Admin Mode</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStudentClick}
              className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-200 transition-colors whitespace-nowrap"
            >
              Test View →
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
      <AdminDashboard />
      </div>
    </div>
  )
}






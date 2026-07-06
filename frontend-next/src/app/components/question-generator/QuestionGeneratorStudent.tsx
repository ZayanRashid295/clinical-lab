"use client"

import { useRouter } from "next/router"
import StudentQuestionView from "./student-question-view"
import { ThemeToggle } from "./theme-toggle"

export default function QuestionGeneratorStudent() {
  const router = useRouter()

  const handleBackClick = () => {
    const from = router.query.from as string | undefined
    if (from === "mock-exam") {
      void router.push("/mock-exams")
      return
    }
    if (from === "create-test") {
      void router.push("/test-creation/study-create")
      return
    }
    if (from === "question-bank") {
      void router.push("/study/question-bank")
      return
    }
    void router.push("/dashboard")
  }
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-background dark:from-gray-900 via-background dark:via-gray-900 to-background/95 dark:to-gray-900/95">
      <div className="flex-shrink-0 bg-card/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-border/40 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleBackClick}
            className="font-semibold text-foreground/75 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 transition-all duration-200 text-sm sm:text-base flex items-center gap-2 group"
          >
            <svg
              className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div className="flex items-center gap-4">
            <div className="text-xs sm:text-sm text-foreground/50 dark:text-gray-400 font-medium tracking-wide uppercase">
              Question Bank
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <StudentQuestionView />
      </div>
    </div>
  )
}


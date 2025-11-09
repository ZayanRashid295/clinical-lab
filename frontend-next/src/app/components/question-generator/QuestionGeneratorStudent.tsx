"use client"

import { useRouter } from "next/router"
import StudentQuestionView from "./student-question-view"
import { ThemeToggle } from "./theme-toggle"

export default function QuestionGeneratorStudent() {
  const router = useRouter()

  const handleBackClick = () => {
    router.push("/question-generator")
  }
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="flex-shrink-0 bg-card/40 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleBackClick}
            className="font-semibold text-foreground/75 hover:text-primary transition-all duration-200 text-sm sm:text-base flex items-center gap-2 group"
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
            <div className="text-xs sm:text-sm text-foreground/50 font-medium tracking-wide uppercase">
              Question Bank
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <StudentQuestionView />
      </div>
    </div>
  )
}


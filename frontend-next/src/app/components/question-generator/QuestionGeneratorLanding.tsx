"use client"

import { useRouter } from "next/router"
import { ChevronDown } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"

export default function QuestionGeneratorLanding() {
  const router = useRouter()

  const handleStudentClick = () => {
    router.push("/question-generator/student")
  }

  const handleAdminClick = () => {
    router.push("/question-generator/admin")
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/20">
      <div className="sticky top-0 z-40 bg-card/95 dark:bg-gray-800/95 backdrop-blur border-b border-border dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div></div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground dark:text-gray-100">UWorld Clone</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground dark:text-gray-100 mb-3 sm:mb-4">UWorld Clone</h1>
          <p className="text-lg sm:text-xl text-muted-foreground dark:text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Medical education platform for creating and practicing comprehensive questions
          </p>
          <div className="flex gap-2 justify-center text-sm text-muted-foreground dark:text-gray-400">
            <span>Built for learning</span>
            <span>•</span>
            <span>Interactive questions</span>
            <span>•</span>
            <span>Rich explanations</span>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Student Section */}
          <Card className="p-6 sm:p-8 bg-card dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 group">
            <div className="mb-6">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                <ChevronDown className="h-6 w-6 text-primary dark:text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2">Student Mode</h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Answer practice questions, review detailed explanations, and track your progress through comprehensive
                medical education content.
              </p>
            </div>
            <Button 
              onClick={handleStudentClick}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 h-10"
            >
              Start Practicing
            </Button>
          </Card>

          {/* Admin Section */}
          <Card className="p-6 sm:p-8 bg-card dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-lg hover:border-secondary/30 dark:hover:border-secondary/40 transition-all duration-300 group">
            <div className="mb-6">
              <div className="w-12 h-12 bg-secondary/10 dark:bg-secondary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 dark:group-hover:bg-secondary/30 transition-colors">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2">Admin Mode</h2>
              <p className="text-muted-foreground dark:text-gray-400 leading-relaxed">
                Create and manage questions, design rich explanations with markdown, tables, and images. Organize
                content by subject and system.
              </p>
            </div>
            <Button 
              onClick={handleAdminClick}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 h-10"
            >
              Manage Questions
            </Button>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-6 bg-card dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:translate-y-[-2px]">
            <h3 className="font-semibold text-foreground dark:text-gray-100 mb-2">Rich Content Editor</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
              Create explanations with markdown, tables, and images for comprehensive student learning.
            </p>
          </Card>

          <Card className="p-6 bg-card dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:translate-y-[-2px]">
            <h3 className="font-semibold text-foreground dark:text-gray-100 mb-2">Question Management</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
              Create, edit, delete, and organize questions with metadata and tagging.
            </p>
          </Card>

          <Card className="p-6 bg-card dark:bg-gray-800 border-border dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:translate-y-[-2px]">
            <h3 className="font-semibold text-foreground dark:text-gray-100 mb-2">Student Experience</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
              Interactive question interface with immediate feedback and detailed explanations.
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-border dark:border-gray-700 text-center text-sm text-muted-foreground dark:text-gray-400">
          <p>Built with modern web technologies for an optimal learning experience</p>
        </div>
      </div>
    </div>
  )
}


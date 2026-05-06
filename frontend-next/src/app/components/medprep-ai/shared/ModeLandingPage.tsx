"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Users, Target, BookOpen, GraduationCap, Play, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"

interface ModeLandingConfig {
  title: string
  subtitle: string
  description: string
  highlight1Title: string
  highlight1Subtitle: string
  highlight2Title: string
  highlight2Subtitle: string
  highlight3Title: string
  highlight3Subtitle: string
  startLabel: string
  startingLabel: string
  startRoute: string
  directStartSuccessRoute: (caseId: string, specialty: string) => string
  directStartFallbackRoute: (caseId: string, specialty: string) => string
  accent: {
    pageGradient: string
    overlayGradient: string
    iconGradient: string
    subtitleText: string
    h1Bg: string
    h2Bg: string
    h3Bg: string
    h1Text: string
    h2Text: string
    h3Text: string
    buttonGradient: string
    buttonHoverGradient: string
  }
}

export function ModeLandingPage({ config }: { config: ModeLandingConfig }) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    const caseId = typeof router.query.caseId === "string" ? router.query.caseId : null
    const directStart = router.query.directStart
    const specialty = typeof router.query.specialty === "string" ? router.query.specialty : "general"

    if (caseId && directStart === "true") {
      setIsNavigating(true)
      const caseDataFromChatbot = sessionStorage.getItem("currentCase")
      if (caseDataFromChatbot) {
        try {
          JSON.parse(caseDataFromChatbot)
          localStorage.setItem("generatedCase", caseDataFromChatbot)
          sessionStorage.removeItem("currentCase")
        } catch (error) {
          console.error("Error parsing case data:", error)
        }
        router.push(config.directStartSuccessRoute(caseId, specialty))
      } else {
        fetch(`/api/cases/get?caseId=${caseId}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.success && data.caseData) {
              sessionStorage.setItem("currentCase", JSON.stringify(data.caseData))
              router.push(config.directStartSuccessRoute(caseId, specialty))
            } else {
              router.push(config.directStartFallbackRoute(caseId, specialty))
            }
          })
          .catch(() => {
            router.push(config.directStartFallbackRoute(caseId, specialty))
          })
      }
    }
  }, [config, router])

  return (
    <div className={`h-screen overflow-hidden ${config.accent.pageGradient}`}>
      <div className="relative h-full">
        <div className={`absolute inset-0 ${config.accent.overlayGradient}`} />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl animate-pulse ${config.accent.iconGradient}`}>
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{config.title}</h1>
                <div className="flex items-center justify-center gap-2 text-base text-gray-600">
                  <GraduationCap className={`h-4 w-4 ${config.accent.subtitleText}`} />
                  <span>{config.subtitle}</span>
                </div>
              </div>
            </div>

            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-6">{config.description}</p>

            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.accent.h1Bg}`}>
                  <Brain className={`h-4 w-4 ${config.accent.h1Text}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{config.highlight1Title}</h3>
                  <p className="text-xs text-gray-600">{config.highlight1Subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.accent.h2Bg}`}>
                  <Users className={`h-4 w-4 ${config.accent.h2Text}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{config.highlight2Title}</h3>
                  <p className="text-xs text-gray-600">{config.highlight2Subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.accent.h3Bg}`}>
                  <Target className={`h-4 w-4 ${config.accent.h3Text}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{config.highlight3Title}</h3>
                  <p className="text-xs text-gray-600">{config.highlight3Subtitle}</p>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <Button
                onClick={() => {
                  setIsNavigating(true)
                  router.push(config.startRoute)
                }}
                disabled={isNavigating}
                size="lg"
                className={`${config.accent.buttonGradient} ${config.accent.buttonHoverGradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg font-semibold px-8 py-4 disabled:opacity-70`}
              >
                {isNavigating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    {config.startingLabel}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    {config.startLabel}
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2 mx-auto bg-white/80 backdrop-blur-sm hover:bg-white border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

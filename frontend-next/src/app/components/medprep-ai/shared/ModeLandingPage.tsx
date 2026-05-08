"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Clock, Target, type LucideIcon } from "lucide-react"
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

  const themedBackground = {
    background:
      "linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 60%, var(--color-primary-50) 100%)",
  } as const

  const decorativeCircle = {
    background:
      "radial-gradient(circle at center, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.18) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.08) 45%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 75%)",
  } as const

  const iconTileBg = {
    background:
      "linear-gradient(180deg, #ffffff 0%, var(--color-primary-50) 100%)",
    boxShadow:
      "0 8px 24px -8px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)",
  } as const

  const themedButton = {
    background:
      "linear-gradient(180deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)",
    boxShadow:
      "0 10px 24px -8px rgba(var(--color-primary-700-rgb, 4, 120, 87), 0.55)",
  } as const

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

  const highlights: { title: string; subtitle: string; icon: LucideIcon }[] = [
    { title: config.highlight1Title, subtitle: config.highlight1Subtitle, icon: GraduationCap },
    { title: config.highlight2Title, subtitle: config.highlight2Subtitle, icon: Clock },
    { title: config.highlight3Title, subtitle: config.highlight3Subtitle, icon: Target },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden" style={themedBackground}>
      {/* Decorative ambient circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full mp-float-slow"
        style={decorativeCircle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -right-56 w-[620px] h-[620px] rounded-full mp-float-slower"
        style={decorativeCircle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-24 w-[110px] h-[110px] rounded-full mp-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.32) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-20 left-20 w-[80px] h-[80px] rounded-full mp-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.30) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
          animationDelay: "1.5s",
        }}
      />

      <div className="relative container mx-auto px-6 min-h-screen flex flex-col justify-center">
        <div className="mx-auto w-full max-w-3xl text-center">
          {/* Top Icon Tile */}
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={iconTileBg}
            >
              <BookOpen className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif font-bold tracking-tight text-gray-900 text-5xl md:text-6xl leading-[1.05] mb-4">
            {config.title}
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-[17px] text-gray-600 mb-8">
            {config.subtitle}
          </p>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-[15px] md:text-base text-gray-600 leading-relaxed mb-10">
            {config.description}
          </p>

          {/* Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {highlights.map(({ title, subtitle, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl bg-white border border-black/5 px-5 py-4 text-left shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon
                      className="h-[18px] w-[18px] text-primary"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-[15px] leading-tight">
                      {title}
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1.5 leading-snug">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <div className="flex flex-col items-center gap-5">
            <Button
              onClick={() => {
                setIsNavigating(true)
                router.push(config.startRoute)
              }}
              disabled={isNavigating}
              size="lg"
              style={themedButton}
              className="text-white rounded-xl text-[15px] font-semibold px-10 py-6 hover:opacity-95 hover:brightness-105 transition-all duration-200 disabled:opacity-70"
            >
              {isNavigating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {config.startingLabel}
                </>
              ) : (
                config.startLabel
              )}
            </Button>

            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

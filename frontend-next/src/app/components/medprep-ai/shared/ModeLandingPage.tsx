"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  GraduationCap,
  Clock,
  Target,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { authService } from "@/shared/services/auth.service"
import {
  medprepSessionService,
  type MedprepSession,
} from "@/lib/fyp/medprep-session-service"
import { getClinicalUserId } from "@/lib/fyp/medprep-user"
import { cn } from "@/shared/utils/cn"
import { APP_PAGE_SHELL } from "@/app/config/app-shell"

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
  /** Icon in the tile above the title (default: open book). */
  topIcon?: LucideIcon
  /** Icons for the three highlight cards (default: graduation cap, clock, target). */
  highlightIcons?: [LucideIcon, LucideIcon, LucideIcon]
  /** Link under the primary CTA (default: dashboard). */
  backHref?: string
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

function resumeModeFromStartRoute(startRoute: string): MedprepSession["mode"] {
  if (
    startRoute.includes("shadow-play") ||
    startRoute.includes("shadow-session") ||
    startRoute.includes("shadow-cases") ||
    startRoute.includes("shadow-mode")
  ) {
    return "SHADOW"
  }
  if (startRoute.includes("evaluation")) return "EVALUATION"
  if (
    startRoute.includes("learn") ||
    startRoute.includes("qa") ||
    startRoute.includes("learn-cases")
  ) {
    return "LEARNING"
  }
  return "PRACTICE"
}

export function ModeLandingPage({ config }: { config: ModeLandingConfig }) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [resumeSessions, setResumeSessions] = useState<MedprepSession[]>([])

  const TopIcon = config.topIcon ?? BookOpen
  const [Icon1, Icon2, Icon3] = config.highlightIcons ?? [
    GraduationCap,
    Clock,
    Target,
  ]
  const backHref = config.backHref ?? "/dashboard"

  const decorativeCircle = {
    background:
      "radial-gradient(circle at center, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.18) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.08) 45%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 75%)",
  } as const

  const themedButton = {
    background:
      "linear-gradient(180deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)",
    boxShadow:
      "0 10px 24px -8px rgba(var(--color-primary-700-rgb, 4, 120, 87), 0.55)",
  } as const

  useEffect(() => {
    if (!router.isReady) return
    const caseId =
      typeof router.query.caseId === "string" ? router.query.caseId : null
    const directStart = router.query.directStart
    const specialty =
      typeof router.query.specialty === "string"
        ? router.query.specialty
        : "general"

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

  useEffect(() => {
    const mode = resumeModeFromStartRoute(config.startRoute)

    const loadResume = () => {
      const user = authService.getCurrentUser()
      const userId = getClinicalUserId(user) ?? "anonymous"
      medprepSessionService
        .listSessions(userId)
        .then((sessions) => {
          setResumeSessions(
            sessions
              .filter((session) => session.mode === mode && session.status === "ACTIVE")
              .slice(0, 6),
          )
        })
        .catch(() => setResumeSessions([]))
    }

    loadResume()
    const onVisible = () => {
      if (document.visibilityState === "visible") loadResume()
    }
    window.addEventListener("focus", loadResume)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("focus", loadResume)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [config.startRoute])

  const highlights: { title: string; subtitle: string; icon: LucideIcon }[] =
    [
      {
        title: config.highlight1Title,
        subtitle: config.highlight1Subtitle,
        icon: Icon1,
      },
      {
        title: config.highlight2Title,
        subtitle: config.highlight2Subtitle,
        icon: Icon2,
      },
      {
        title: config.highlight3Title,
        subtitle: config.highlight3Subtitle,
        icon: Icon3,
      },
    ]

  return (
    <div className={cn(APP_PAGE_SHELL, "relative min-h-screen overflow-x-hidden")}>
      {/* Decorative ambient circles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 h-[520px] w-[520px] rounded-full mp-float-slow"
        style={decorativeCircle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-56 -bottom-56 h-[620px] w-[620px] rounded-full mp-float-slower"
        style={decorativeCircle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 right-24 h-[110px] w-[110px] rounded-full mp-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.32) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-20 left-20 h-[80px] w-[80px] rounded-full mp-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.30) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
          animationDelay: "1.5s",
        }}
      />

      <div className="relative container mx-auto flex min-h-screen flex-col justify-start px-6 py-14 md:py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          {/* Top Icon Tile */}
          <div className="mb-8 flex justify-center">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl",
                "bg-gradient-to-b from-white to-primary-50",
                "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.6)]",
                "dark:from-primary-900/55 dark:to-primary-900/30",
                "dark:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.1)]",
              )}
            >
              <TopIcon
                className="h-7 w-7 text-primary-600 dark:text-primary-300"
                strokeWidth={1.75}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 font-serif text-5xl leading-[1.05] font-bold tracking-tight text-gray-900 md:text-6xl dark:text-slate-100">
            {config.title}
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-base text-gray-600 md:text-[17px] dark:text-slate-400">
            {config.subtitle}
          </p>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-[15px] leading-relaxed text-gray-600 md:text-base dark:text-slate-400">
            {config.description}
          </p>

          {/* Highlight Cards */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {highlights.map(({ title, subtitle, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl border border-black/5 bg-white px-5 py-4 text-left shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                      "bg-primary-100/90 ring-1 ring-primary-500/15",
                      "dark:bg-primary-500/20 dark:ring-primary-400/25",
                    )}
                  >
                    <Icon
                      className="h-[18px] w-[18px] text-primary-700 dark:text-primary-200"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] leading-tight font-semibold text-gray-900 dark:text-slate-100">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-snug text-gray-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {resumeSessions.length > 0 ? (
            <div
              className="mb-10 rounded-2xl border border-primary-200/80 bg-white/90 p-4 text-left shadow-sm dark:border-white/15 dark:bg-slate-900/70 dark:shadow-none"
              role="region"
              aria-label="Resume active sessions"
            >
              <p className="text-center text-sm font-semibold text-primary-900 dark:text-slate-100">
                Resume an active session
              </p>
              <div className="mt-3 space-y-2">
                {resumeSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={medprepSessionService.getContinueUrl(session)}
                    className="block rounded-lg border border-primary-200/90 bg-primary-50/80 px-3 py-2.5 text-sm font-medium text-primary-950 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-100 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                  >
                    {session.title || session.caseId || "Untitled case"}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

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
              className="rounded-xl px-10 py-6 text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-105 hover:opacity-95 disabled:opacity-70"
            >
              {isNavigating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  {config.startingLabel}
                </>
              ) : (
                config.startLabel
              )}
            </Button>

            <Link
              href={backHref}
              className="text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

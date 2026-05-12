"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarClock, ShieldAlert, AlertCircle } from "lucide-react"
import type { ConversationBlockedModalState } from "@/lib/fyp/medprep-conversation-errors"
import { cn } from "@/shared/utils/cn"
import { APP_GLASS_CARD } from "@/app/config/app-shell"

type MedPrepConversationBlockedModalProps = {
  open: boolean
  state: ConversationBlockedModalState
  onClose: () => void
}

export function MedPrepConversationBlockedModal({
  open,
  state,
  onClose,
}: MedPrepConversationBlockedModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || typeof document === "undefined") return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const Icon =
    state.variant === "case_limit"
      ? CalendarClock
      : state.variant === "subscription"
        ? ShieldAlert
        : AlertCircle

  const iconWrap =
    state.variant === "case_limit"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
      : state.variant === "subscription"
        ? "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200"
        : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-y-auto overflow-x-hidden overscroll-contain bg-black/50 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      {/* Centers vertically when short; allows page scroll when modal is taller than viewport */}
      <div className="flex min-h-[100svh] w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div
          className={cn(
            APP_GLASS_CARD,
            "my-auto flex max-h-[min(90dvh,900px)] w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="medprep-blocked-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex gap-3 sm:gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconWrap}`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h2
                  id="medprep-blocked-title"
                  className="break-words text-lg font-semibold leading-snug text-gray-900 dark:text-slate-100"
                >
                  {state.title}
                </h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {state.description}
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-4 py-4 dark:border-white/10 dark:bg-white/5 sm:px-5">
            <div className="flex min-w-0 flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-auto min-h-10 w-full whitespace-normal px-3 py-2.5 text-center"
              >
                Close
              </Button>
              <Link href="/medprep-ai" className="block min-w-0" onClick={onClose}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-10 w-full whitespace-normal border-emerald-200 px-3 py-2.5 text-center text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-emerald-950/30"
                >
                  MedPrep home
                </Button>
              </Link>
              {(state.variant === "case_limit" || state.variant === "subscription") && (
                <Link href="/my-subscription" className="block min-w-0" onClick={onClose}>
                  <Button
                    type="button"
                    className="h-auto min-h-10 w-full whitespace-normal bg-emerald-600 px-3 py-2.5 text-center text-white hover:bg-emerald-700"
                  >
                    View subscription and usage
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

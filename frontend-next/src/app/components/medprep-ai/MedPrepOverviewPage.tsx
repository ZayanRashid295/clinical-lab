"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MEDPREP_MODES } from "./modes";
import { authService } from "@/shared/services/auth.service";
import { medprepSessionService, type MedprepSession } from "@/lib/fyp/medprep-session-service";
import { getClinicalUserId } from "@/lib/fyp/medprep-user";

export default function MedPrepOverviewPage() {
  const [sessions, setSessions] = useState<MedprepSession[]>([])

  const themedButton = {
    background:
      "linear-gradient(90deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)",
  } as const

  useEffect(() => {
    const load = () => {
      const user = authService.getCurrentUser()
      const userId = getClinicalUserId(user) ?? "anonymous"
      medprepSessionService
        .listSessions(userId)
        .then(setSessions)
        .catch(() => setSessions([]))
    }
    load()
    const retry = setTimeout(load, 400)
    const onVisible = () => {
      if (document.visibilityState === "visible") load()
    }
    window.addEventListener("focus", load)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(retry)
      window.removeEventListener("focus", load)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === "ACTIVE").slice(0, 6),
    [sessions]
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Choose Your Learning Mode
          </h1>
          <p className="text-gray-700 mt-2 leading-relaxed max-w-2xl">
            Select how you want to practice with medical cases
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:opacity-80 whitespace-nowrap"
        >
          Back to Dashboard
        </Link>
      </div>

      {activeSessions.length > 0 ? (
        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Continue ongoing simulations</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeSessions.map((session) => (
              <Link
                key={session.id}
                href={medprepSessionService.getContinueUrl(session)}
                className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 hover:bg-emerald-50 transition-colors"
              >
                <p className="text-sm font-semibold text-emerald-900">
                  {session.title || session.caseId || "Untitled case"}
                </p>
                <p className="text-xs text-emerald-700 mt-1">{session.mode} mode</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {MEDPREP_MODES.map((mode) => (
          <div
            key={mode.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900">{mode.title}</h2>
            <p className="text-sm font-semibold text-primary mt-2">
              {mode.heroHeadline}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3 flex-1">
              {mode.summary}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
              {mode.highlights.map((h) => (
                <div key={h.title} className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    {h.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-snug">
                    {h.subtitle}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/medprep-ai/${mode.id}`}
                style={themedButton}
                className="inline-flex justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 text-center transition-opacity"
              >
                {mode.ctaLabel}
              </Link>
              <Link
                href="/"
                className="inline-flex justify-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

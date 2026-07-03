"use client";

import Link from "next/link";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  MarketingThemeShell,
  MarketingThemeToggle,
} from "@/app/components/marketing/marketing-theme";

interface LandingAuthShellProps {
  children: React.ReactNode;
}

/** Header + page chrome shared with the marketing landing page. */
export function LandingAuthShell({ children }: LandingAuthShellProps) {
  return (
    <MarketingThemeShell>
      <div className="flex min-h-screen flex-col">
        <header
          className="sticky top-0 z-50 shrink-0 border-b backdrop-blur-xl"
          style={{
            borderColor: "var(--mkt-border)",
            background: "var(--mkt-header-bg)",
          }}
        >
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
                style={{ background: "var(--mkt-accent)" }}
              >
                <Stethoscope className="h-5 w-5 text-white" aria-hidden />
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: "var(--mkt-text)" }}
              >
                MedPrepAI
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <MarketingThemeToggle />
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                )}
                style={{ color: "var(--mkt-text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--mkt-text)";
                  e.currentTarget.style.background = "var(--mkt-accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--mkt-text-muted)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Back to home</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
      </div>
    </MarketingThemeShell>
  );
}

export function LandingAuthLoading() {
  return (
    <MarketingThemeShell>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: "var(--mkt-accent-ring)",
              borderTopColor: "var(--mkt-accent)",
            }}
          />
          <p className="text-sm font-medium mkt-auth-muted">Preparing your session…</p>
        </div>
      </div>
    </MarketingThemeShell>
  );
}

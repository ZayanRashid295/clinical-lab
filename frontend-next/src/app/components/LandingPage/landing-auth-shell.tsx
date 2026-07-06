"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  MarketingThemeShell,
  MarketingThemeToggle,
} from "@/app/components/marketing/marketing-theme";

interface LandingAuthShellProps {
  children: React.ReactNode;
}

/** Minimal chrome for sign-in / sign-up — matches Landing Page 2. */
export function LandingAuthShell({ children }: LandingAuthShellProps) {
  return (
    <MarketingThemeShell className="mkt-auth-page">
      <div className="mkt-auth-shell flex min-h-screen flex-col">
        <header className="mkt-auth-shell-header">
          <Link href="/landing-page" className="mkt-auth-shell-back">
            <ArrowLeft aria-hidden />
            <span>Back</span>
          </Link>
          <MarketingThemeToggle />
        </header>

        <main className="mkt-auth-shell-main">{children}</main>
      </div>
    </MarketingThemeShell>
  );
}

export function LandingAuthLoading() {
  return (
    <MarketingThemeShell className="mkt-auth-page">
      <div className="mkt-auth-layout">
        <div className="mkt-auth-bg" aria-hidden />
        <div className="mkt-auth-loading">
          <div className="mkt-auth-loading-spinner" aria-hidden />
          <p>Preparing your session…</p>
        </div>
      </div>
    </MarketingThemeShell>
  );
}

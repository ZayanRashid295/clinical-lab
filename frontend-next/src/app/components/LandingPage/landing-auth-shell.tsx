"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Moon, Stethoscope, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/shared/utils/cn";

interface LandingAuthShellProps {
  children: React.ReactNode;
}

/** Header + page chrome aligned with {@link LandingNav} / marketing pages. */
export function LandingAuthShell({ children }: LandingAuthShellProps) {
  const { config, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 shrink-0 border-b border-white/10 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-900/40">
              <Stethoscope className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="text-lg font-bold text-white">MedPrepAI</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setTheme(config.theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              {mounted && config.theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                "text-slate-300 transition-colors hover:bg-white/5 hover:text-white",
              )}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
    </div>
  );
}

export function LandingAuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-500/30 border-t-primary-500" />
        <p className="text-sm font-medium text-slate-400">Preparing your session…</p>
      </div>
    </div>
  );
}

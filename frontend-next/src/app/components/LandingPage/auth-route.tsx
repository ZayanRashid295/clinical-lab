"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { AuthScreen, type AuthModalView } from "./auth-screen";
import { authService } from "@/shared/services/auth.service";

function queryString(
  v: string | string[] | undefined
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export function AuthRoutePage() {
  const router = useRouter();
  const [readyToShowForm, setReadyToShowForm] = useState(false);

  const packageId = queryString(router.query.packageId);
  const modeVal = queryString(router.query.mode);
  const initialView: AuthModalView = modeVal === "signup" ? "signup" : "login";

  useEffect(() => {
    if (!router.isReady) return;
    if (authService.isAuthenticated()) {
      const dest = packageId
        ? `/checkout-basic?packageId=${encodeURIComponent(packageId)}`
        : "/";
      void router.replace(dest);
      return;
    }
    setReadyToShowForm(true);
  }, [router, router.isReady, packageId]);

  const onNavigateMode = (view: AuthModalView) => {
    void router.replace(
      {
        pathname: "/auth",
        query: {
          ...(packageId ? { packageId } : {}),
          mode: view,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  if (!router.isReady || !readyToShowForm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-600/30 border-t-teal-600 dark:border-teal-400/25 dark:border-t-teal-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Preparing your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="shrink-0 border-b border-slate-200/90 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-white/10 dark:bg-slate-950/90 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="flex h-14 w-full items-center px-4 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="group -ml-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to MedPrepAI
          </Link>
        </div>
      </header>
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <AuthScreen
          initialView={initialView}
          pendingPackageId={packageId ?? null}
          onNavigateMode={onNavigateMode}
        />
      </main>
    </div>
  );
}

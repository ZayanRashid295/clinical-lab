"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthScreen, type AuthModalView } from "./auth-screen";
import { authService } from "@/shared/services/auth.service";
import { LandingAuthLoading, LandingAuthShell } from "./landing-auth-shell";

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
        ? `/checkout?planId=${encodeURIComponent(packageId)}`
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
    return <LandingAuthLoading />;
  }

  return (
    <LandingAuthShell>
      <AuthScreen
        initialView={initialView}
        pendingPackageId={packageId ?? null}
        onNavigateMode={onNavigateMode}
      />
    </LandingAuthShell>
  );
}

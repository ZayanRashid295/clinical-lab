"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/shared";
import { routeAfterLogin } from "@/lib/auth/post-login-route";
import type { ExamTrack } from "./landing-v2-data";
import type { MedPrepLandingActions } from "./MedPrepAILanding";
import type { ProgramBrandActions } from "./ProgramBrandLanding";

export function useLandingV2Actions() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(authService.isAuthenticated());
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  const goToAuth = useCallback(
    (opts?: { mode?: "login" | "signup" }) => {
      const q: Record<string, string> = {};
      if (opts?.mode === "signup") q.mode = "signup";
      const search = new URLSearchParams(q).toString();
      void router.push(search ? `/auth?${search}` : "/auth");
    },
    [router],
  );

  const openApp = useCallback(() => {
    const user = authService.getCurrentUser();
    const dest = routeAfterLogin(user?.roles);
    void router.push(dest);
  }, [router]);

  const navigateToProgram = useCallback(
    (program: ExamTrack) => {
      void router.push(`/landing-page/${program}`);
    },
    [router],
  );

  const beginPrep = useCallback(() => {
    if (isAuthenticated) {
      void router.push("/study/question-bank");
      return;
    }
    goToAuth();
  }, [goToAuth, isAuthenticated, router]);

  const homeActions: MedPrepLandingActions = useMemo(
    () => ({
      isAuthenticated,
      loginLabel: isAuthenticated ? "Open app" : "Sign in",
      primaryCtaLabel: isAuthenticated ? "Go to dashboard" : "Sign in",
      onLogin: () => {
        if (isAuthenticated) openApp();
        else goToAuth();
      },
      onSignup: () => {
        if (isAuthenticated) openApp();
        else goToAuth({ mode: "signup" });
      },
      onStartTrial: () => {
        if (isAuthenticated) openApp();
        else goToAuth({ mode: "signup" });
      },
      onNavigateToProgram: navigateToProgram,
    }),
    [goToAuth, isAuthenticated, navigateToProgram, openApp],
  );

  const programActions = useCallback(
    (): ProgramBrandActions => ({
      isAuthenticated,
      primaryCtaLabel: isAuthenticated ? "Go to dashboard" : "Sign in",
      onLogin: () => {
        if (isAuthenticated) openApp();
        else goToAuth();
      },
      onNavigateToProgram: navigateToProgram,
      onBeginPrep: beginPrep,
    }),
    [beginPrep, goToAuth, isAuthenticated, navigateToProgram, openApp],
  );

  return { homeActions, programActions };
}

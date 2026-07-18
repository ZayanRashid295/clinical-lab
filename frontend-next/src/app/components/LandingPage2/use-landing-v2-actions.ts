"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/shared";
import { routeAfterLogin } from "@/lib/auth/post-login-route";
import {
  categoryPath,
  productPath,
  type ExamProduct,
  type ExamTrack,
} from "./landing-v2-data";
import type { MedPrepLandingActions } from "./MedPrepAILanding";
import type { ProgramUiActions } from "./ProgramUiLanding";
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

  const navigateToCategory = useCallback(
    (category: ExamTrack) => {
      void router.push(categoryPath(category));
    },
    [router],
  );

  const navigateToProgram = useCallback(
    (program: ExamTrack, product: ExamProduct = "medicine-and-allied") => {
      void router.push(productPath(program, product));
    },
    [router],
  );

  const beginPrep = useCallback(() => {
    if (isAuthenticated) {
      void router.push("/test-creation/study-create");
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
      onNavigateToCategory: navigateToCategory,
    }),
    [goToAuth, isAuthenticated, navigateToCategory, navigateToProgram, openApp],
  );

  /** Actions for new clinical category pages (ui/ design). */
  const programUiActions = useCallback(
    (): ProgramUiActions => ({
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

  /** Actions for Medicine and Allied cinematic product pages. */
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

  return { homeActions, programUiActions, programActions };
}

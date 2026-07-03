"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { authService } from "@/shared";
import { routeAfterLogin } from "@/lib/auth/post-login-route";
import {
  MedPrepAILanding,
  type ExamTrack,
  type MedPrepLandingActions,
} from "./MedPrepAILanding";
import { MarketingThemeShell } from "../marketing/marketing-theme";

export function LandingPage2() {
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

  const scrollToPrograms = useCallback((program: ExamTrack) => {
    setTimeout(() => {
      document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    // Tab state is updated inside MedPrepAILanding via handleNavExam
    void program;
  }, []);

  const scrollToSampleQuestions = useCallback(() => {
    document.getElementById("sample-questions")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const actions: MedPrepLandingActions = useMemo(
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
        else goToAuth();
      },
      onStartTrial: () => {
        if (isAuthenticated) openApp();
        else goToAuth();
      },
      onBeginProgram: (program, intent) => {
        if (intent === "explore") {
          scrollToPrograms(program);
          return;
        }
        if (isAuthenticated) {
          void router.push("/study/question-bank");
          return;
        }
        goToAuth();
      },
      onViewSampleQuestions: scrollToSampleQuestions,
    }),
    [
      goToAuth,
      isAuthenticated,
      openApp,
      router,
      scrollToPrograms,
      scrollToSampleQuestions,
    ],
  );

  return (
    <MarketingThemeShell className="medprep-landing-v2">
      <MedPrepAILanding actions={actions} />
    </MarketingThemeShell>
  );
}

export default LandingPage2;

"use client";

import { LandingV2Chrome } from "./landing-v2-chrome";
import { CinematicHero, CinematicHeroContent, useLenis } from "../hero-sequence";
import { MedPrepCinematicBody } from "./MedPrepCinematicBody";
import type { ExamTrack } from "./landing-v2-data";

export type { ExamTrack };

export interface MedPrepLandingActions {
  onLogin: () => void;
  onSignup: () => void;
  onStartTrial: () => void;
  onNavigateToProgram: (program: ExamTrack) => void;
  isAuthenticated: boolean;
  primaryCtaLabel: string;
  loginLabel: string;
}

export function MedPrepAILanding({ actions }: { actions: MedPrepLandingActions }) {
  const lenis = useLenis();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -72, duration: 1.5 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <LandingV2Chrome activePage="home" actions={actions} cinematicNav>
      <CinematicHero ariaLabel="MedPrepAI — intelligent exam preparation">
        <CinematicHeroContent
          kicker="MedPrepAI"
          title={
            <>
              Stop guessing.
              <br />
              Start understanding.
            </>
          }
          subtitle="3,000+ exam-level questions with a full explanation for every single option — so you learn deeply, score higher, and walk in confident."
          punchlines={["Every option explained", "Zero guesswork", "Exam-day ready"]}
          primaryCta={{
            label: actions.isAuthenticated ? "Go to dashboard" : "Start free — no card required",
            onClick: actions.onStartTrial,
          }}
          secondaryCta={{
            label: "See how it works",
            onClick: () => scrollTo("how-it-works"),
          }}
          stats={[
            { num: "3,000+", label: "Exam-level questions" },
            { num: "100%", label: "Options explained" },
            { num: "Real", label: "Exam interface" },
            { num: "Live", label: "Progress tracking" },
          ]}
        />
      </CinematicHero>

      <div className="landing-content-bridge lp-cinematic-body">
        <MedPrepCinematicBody
          onStartTrial={actions.onStartTrial}
          onScrollToPlatform={() => scrollTo("platform")}
          isAuthenticated={actions.isAuthenticated}
        />
      </div>
    </LandingV2Chrome>
  );
}

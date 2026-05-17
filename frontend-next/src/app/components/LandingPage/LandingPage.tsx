"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingCategoriesSection } from "./LandingCategoriesSection";
import { PricingCarousel } from "./PricingCarousel";
import { LandingFooter } from "./LandingFooter";
import { FeatureCard } from "./FeatureCard";
import { DemoVideo } from "@/app/components/demo";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/shared/utils/cn";
import { authService } from "@/shared";
import {
  AUDIENCE_BLOCKS,
  FAQ_ITEMS,
  LEARNING_MODES,
  TESTIMONIALS,
} from "./landing-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import {
  Brain,
  Users,
  BarChart3,
  Award,
  Target,
  Zap,
  Shield,
  Clock,
  Check,
  ArrowRight,
  Quote,
} from "lucide-react";

const heroImage =
  "/images/Medical_students_AI_learning_collaboration_6db2826f.png";
const studentPracticeImage =
  "/images/Student_practicing_virtual_patient_interview_225e435d.png";
const facultyAnalyticsImage =
  "/images/Faculty_reviewing_student_analytics_dashboard_94a01cbe.png";

const FEATURES = [
  { icon: Brain, title: "AI patient simulations", description: "Natural dialogue, evolving vitals, and realistic clinical responses." },
  { icon: Target, title: "Shadow mode", description: "Observe expert reasoning and ask why at any teachable moment." },
  { icon: BarChart3, title: "OSCE-style rubrics", description: "Competency-aligned scoring on history, exam, workup, and documentation." },
  { icon: Award, title: "Gamification", description: "Streaks, achievements, Elo ratings, and specialty leaderboards." },
  { icon: Zap, title: "Instant feedback", description: "Real-time coaching on decisions and communication." },
  { icon: Users, title: "Faculty workspace", description: "Assignments, messaging, cases, and cohort analytics." },
  { icon: Shield, title: "Evidence-based cases", description: "Grounded in guidelines with institution-authored content." },
  { icon: Clock, title: "Always on", description: "Cloud platform for practice anytime, on any device." },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-lg text-slate-400">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.08 });
  return (
    <section id="features" ref={ref} className="bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Everything you need to train clinicians"
          description="From solo study to full institutional deployments—one platform, multiple modes, measurable outcomes."
        />
        <div
          className={cn(
            "mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4",
            "transition-all duration-700",
            isVisible ? "opacity-100" : "opacity-0 translate-y-8",
          )}
        >
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModesSection() {
  return (
    <section id="modes" className="border-y border-white/5 bg-slate-900/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Learning modes"
          title="Learn, shadow, and perform"
          description="Three complementary experiences—each designed for a different stage of clinical mastery."
        />
        <div className="mt-14 space-y-16">
          {LEARNING_MODES.map((mode, i) => (
            <div
              key={mode.id}
              className={cn(
                "grid items-center gap-10 lg:grid-cols-2",
                i % 2 === 1 && "lg:[&>div:first-child]:order-2",
              )}
            >
              <div>
                <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-300">
                  {mode.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                  {mode.title}
                </h3>
                <p className="mt-3 text-slate-400">{mode.description}</p>
                <ul className="mt-6 space-y-2">
                  {mode.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-primary-500" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src={mode.image}
                  alt={mode.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Sign up & link", text: "Create an account or join via your institution email domain." },
    { step: "02", title: "Pick a mode", text: "Shadow faculty, complete guided cases, or run full OSCE encounters." },
    { step: "03", title: "Get feedback", text: "Review rubric scores, SOAP grading, and faculty comments." },
    { step: "04", title: "Track growth", text: "Dashboards, assignments, and analytics show progress over time." },
  ];

  return (
    <section id="how-it-works" className="bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow"
          title="How MedPrepAI works"
          description="A clear path from first login to confident patient encounters."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6"
            >
              <span className="text-3xl font-bold text-primary-500/80">{s.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection({ onCta }: { onCta: (institution?: boolean) => void }) {
  return (
    <section className="border-y border-white/5 bg-slate-900/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {AUDIENCE_BLOCKS.map((block, i) => (
            <div
              key={block.title}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80"
            >
              <div className="relative aspect-[21/9]">
                <Image src={block.image} alt="" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white">{block.title}</h3>
                <p className="mt-2 text-slate-400">{block.description}</p>
                <ul className="mt-6 space-y-2">
                  {block.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 bg-primary-600 hover:bg-primary-500"
                  onClick={() => onCta(i === 1)}
                >
                  {block.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by learners and educators"
          description="See why programs adopt MedPrepAI for scalable clinical skills training."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <Quote className="h-8 w-8 text-primary-500/50" />
              <p className="mt-4 flex-1 text-slate-300">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-white/10 pt-4">
                <p className="font-medium text-white">{t.name}</p>
                <p className="text-sm text-slate-500">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="border-t border-white/5 bg-slate-900/30 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers before you start your free trial."
        />
        <Accordion type="single" collapsible className="mt-12">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-slate-100 hover:text-white hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function LandingPage() {
  const router = useRouter();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const openDemo = useCallback(() => {
    setIsDemoOpen(true);
    if (typeof window !== "undefined" && window.location.hash !== "#demo") {
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#demo`);
    }
  }, []);

  const closeDemo = useCallback(() => {
    setIsDemoOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#demo") {
      const base = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", base || "/");
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(authService.isAuthenticated());
    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#demo") setIsDemoOpen(true);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const goToAuth = (opts?: { mode?: "login" | "signup"; packageId?: string }) => {
    const q: Record<string, string> = {};
    if (opts?.mode === "signup") q.mode = "signup";
    if (opts?.packageId) q.packageId = opts.packageId;
    const search = new URLSearchParams(q).toString();
    void router.push(search ? `/auth?${search}` : "/auth");
  };

  const handleGetStarted = () => {
    if (isAuthenticated) void router.push("/dashboard");
    else goToAuth({ mode: "signup" });
  };

  const handlePackageSelect = (packageId: string) => {
    if (isAuthenticated) void router.push(`/checkout-basic?packageId=${packageId}`);
    else goToAuth({ packageId });
  };

  const scrollToFeatures = () => {
    document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
  };

  const heroSlides = [
    {
      title: "Revolutionize medical education with AI",
      subtitle:
        "Practice clinical interviews, shadow expert doctors, and receive OSCE-style assessments—in a safe, scalable environment.",
      image: heroImage,
      ctaPrimary: "Start free",
      ctaSecondary: "Watch demo",
    },
    {
      title: "AI patients that feel real",
      subtitle:
        "Natural conversations, evolving clinical data, and repeatable encounters for every learner.",
      image: studentPracticeImage,
      ctaPrimary: "Try a case",
      ctaSecondary: "See modes",
    },
    {
      title: "Shadow mode learning",
      subtitle:
        "Pause expert encounters, ask why, and build clinical reasoning step by step.",
      image: facultyAnalyticsImage,
      ctaPrimary: "Explore shadow",
      ctaSecondary: "Watch demo",
    },
    {
      title: "Faculty & institution ready",
      subtitle:
        "Assignments, messaging, custom cases, and analytics—built for medical schools and hospitals.",
      image: heroImage,
      ctaPrimary: "View plans",
      ctaSecondary: "Contact sales",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <LandingNav
        onLoginClick={() => goToAuth()}
        onSignupClick={() => goToAuth({ mode: "signup" })}
      />

      <main>
        <LandingHero
          slides={heroSlides}
          isAuthenticated={isAuthenticated}
          onPrimaryClick={handleGetStarted}
          onDemoClick={openDemo}
          onExploreClick={scrollToFeatures}
        />

        <LandingCategoriesSection
          isAuthenticated={isAuthenticated}
          onGetStarted={() => goToAuth({ mode: "signup" })}
        />

        <FeaturesSection />

        <ModesSection />

        <HowItWorksSection />

        <AudienceSection
          onCta={(institution) => {
            if (institution) {
              document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
            } else {
              handleGetStarted();
            }
          }}
        />

        <TestimonialsSection />

        <section id="pricing" className="bg-slate-950 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Pricing"
              title="Plans for every learner and program"
              description="All active packages from your administrator—compare features and start in minutes."
            />
            <div className="mt-14 px-0 sm:px-8 lg:px-12">
              <PricingCarousel
                onPackageSelect={handlePackageSelect}
                onContactSales={() => goToAuth({ mode: "signup" })}
              />
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary-500" /> Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary-500" /> Education discounts
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary-500" /> Institution billing
              </span>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-primary-500/20 bg-primary-950/40 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--color-primary-500-rgb),0.15),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to practice like a doctor?
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Join students and institutions using MedPrepAI for safer, smarter
              clinical training.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-500"
                onClick={handleGetStarted}
              >
                {isAuthenticated ? "Open dashboard" : "Get started free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={openDemo}
              >
                Watch demo
              </Button>
            </div>
          </div>
        </section>

        <FaqSection />
      </main>

      <LandingFooter
        onLogin={() => goToAuth()}
        onSignup={() => goToAuth({ mode: "signup" })}
      />

      {isDemoOpen && <DemoVideo onExit={closeDemo} />}
    </div>
  );
}

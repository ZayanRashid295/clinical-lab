"use client";

import { type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Eye,
  FlaskConical,
  Layers,
  LayoutGrid,
  Sparkles,
  Shield,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { AI_SIMULATION_MODULE, CLINICAL_LAB_MODULE } from "./demo-constants";
import { MEDPREP_MODES } from "@/app/components/medprep-ai/modes";
import { useCountUp, useDelayedFlag, useTypewriter } from "./demo-hooks";
import {
  anim,
  GlowBurst,
  SceneShell,
  SceneTag,
  WordReveal,
} from "./demo-primitives";
import { demoDiagram, demoTheme } from "./demo-theme";
import {
  ClinicalLabCreateTestSnapshot,
  ClinicalLabSessionSnapshot,
} from "./demo-clinical-lab-snapshots";
import {
  EvaluationModeSnapshot,
  LearningModeSnapshot,
  CaseGenerationUiScreenshot,
  ModesHubUiScreenshot,
  PracticeModeSnapshot,
  ShadowModeSnapshot,
} from "./demo-mode-snapshots";
import type { MedPrepModeId } from "./demo-mode-data";
import { PlatformModulesSnapshot } from "./demo-platform-snapshots";
import { SplitCopyVisualSlide } from "./demo-page-layout";
import { StackedCopyVisualSlide } from "./demo-stacked-layout";
import { DemoTitleHero } from "./demo-title-hero";
import {
  demoType,
  SPLIT_HEADER,
  MODE_SLIDE_HEADER,
  modeSlideType,
} from "./demo-typography";

function ModeSceneLayout({
  tagIcon: TagIcon,
  tagLabel,
  headline,
  headlineGradientFrom = 2,
  description,
  bullets,
  snapshot,
  snapshotDelay = 900,
}: {
  tagIcon: typeof Stethoscope;
  tagLabel: string;
  headline: string;
  headlineGradientFrom?: number;
  description: string;
  bullets: string[];
  snapshot: ReactNode;
  snapshotDelay?: number;
}) {
  return (
    <StackedCopyVisualSlide
      maxWidth="100rem"
      visualClassName="h-[min(calc(100dvh-14rem),44rem)]"
      header={
        <header className={MODE_SLIDE_HEADER}>
          <SceneTag
            icon={TagIcon}
            label={tagLabel}
            delayMs={150}
            className={modeSlideType.tag}
            iconClassName="h-5 w-5 sm:h-6 sm:w-6"
          />
          <div className="w-full max-w-4xl">
            <WordReveal
              text={headline}
              className={modeSlideType.headline}
              baseDelay={400}
              gradientFrom={headlineGradientFrom}
              stagger={70}
            />
            <div className="mt-3 text-left">
            <p
              className={cn(modeSlideType.desc, demoTheme.muted)}
              style={anim("demo-fade-up", 750)}
            >
              {description}
            </p>
            <ul className="mt-4 flex w-full flex-col gap-2.5 sm:gap-3">
              {bullets.map((b, i) => {
                const colon = b.indexOf(":");
                const title = colon > 0 ? b.slice(0, colon) : b;
                const detail = colon > 0 ? b.slice(colon + 1).trim() : null;
                return (
                  <li
                    key={b}
                    className={cn(
                      "flex items-start gap-3",
                      modeSlideType.bullets,
                      demoTheme.body,
                    )}
                    style={anim("demo-fade-up", 900 + i * 120, "0.5s")}
                  >
                    <span
                      className={cn(
                        "mt-2.5 h-2 w-2 shrink-0 rounded-full",
                        demoTheme.bullet,
                      )}
                    />
                    <span>
                      <span className="font-semibold text-white">{title}</span>
                      {detail ? (
                        <span className="text-zinc-400">: {detail}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            </div>
          </div>
        </header>
      }
      visual={
        <div
          className={cn(demoDiagram.visualSlot, "h-full w-full")}
          style={anim("demo-fade-in", snapshotDelay, "0.7s")}
        >
          <div className={cn(demoDiagram.visualFull, "mx-auto h-full w-full")}>{snapshot}</div>
        </div>
      }
    />
  );
}


export function TitleScene() {
  return (
    <SceneShell layout="fill" className="!bg-demo-950">
      <DemoTitleHero />
    </SceneShell>
  );
}

const PAIN_CARDS = [
  { stat: "68%", title: "Under-prepared for clerkships", desc: "Anxiety before the first real patient interview." },
  { stat: "4:1", title: "Faculty time crunch", desc: "Preceptors can't observe every learner encounter." },
  { stat: "12+", title: "Disconnected tools", desc: "Cases, QBank, and OSCE prep in separate systems." },
];

export function ProblemScene() {
  return (
    <SceneShell fullWidth className="!py-8 sm:!py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 sm:gap-12 sm:px-8 lg:gap-16">
        <header className="flex max-w-3xl flex-col items-center gap-5 text-center sm:gap-7">
          <SceneTag icon={Activity} label="The problem" delayMs={200} />
          <WordReveal text="Clinical training doesn't scale" baseDelay={500} gradientFrom={2} />
          <p
            className={cn("leading-relaxed", demoType.bodyMuted, demoTheme.muted)}
            style={anim("demo-fade-up", 900)}
          >
            Simulation and QBank shouldn&apos;t live in separate apps. Learners need both bedside skills
            and exam-ready MCQs.
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-8 lg:gap-10 xl:gap-12">
          {PAIN_CARDS.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                "flex flex-col gap-4 p-6 sm:gap-5 sm:p-8",
                demoTheme.card,
                i === 0 && "lg:-translate-y-3",
                i === 1 && "lg:translate-y-6",
                i === 2 && "lg:-translate-y-2",
              )}
              style={anim("demo-slide-up-deep", 1100 + i * 260, "0.75s")}
            >
              <p className={cn(demoType.cardStat, demoTheme.stat)}>{c.stat}</p>
              <div className="space-y-2 sm:space-y-2.5">
                <p className={cn(demoType.cardTitle, "text-white")}>{c.title}</p>
                <p className={cn("leading-relaxed", demoType.cardDesc, demoTheme.muted)}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}


export function PlatformOverviewScene() {
  const show = useDelayedFlag(350);
  return (
    <SceneShell fullWidth className="!py-8 sm:!py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-3 sm:gap-10 sm:px-6 lg:gap-12">
        <div className="flex flex-col items-center gap-5 sm:gap-6">
          <SceneTag icon={LayoutGrid} label="Platform" delayMs={150} />
          <WordReveal text="Two modules one platform" baseDelay={350} gradientFrom={2} />
          <p
            className={cn(
              "max-w-2xl text-center leading-relaxed sm:max-w-3xl",
              demoType.bodyMuted,
              demoTheme.muted,
            )}
            style={anim("demo-fade-up", 700)}
          >
            {AI_SIMULATION_MODULE} for encounters. Clinical Lab for high-yield MCQs with shared login,
            institution, and analytics.
          </p>
        </div>
        <div className="flex w-full justify-center pt-2 sm:pt-4">
          {show && <PlatformModulesSnapshot style={anim("demo-pop", 0, "0.85s")} />}
        </div>
      </div>
    </SceneShell>
  );
}

export function ModesHubScene() {
  const showHub = useDelayedFlag(400);
  return (
    <SplitCopyVisualSlide
      header={
        <header className={SPLIT_HEADER}>
          <SceneTag icon={Layers} label={`${AI_SIMULATION_MODULE} module`} delayMs={150} />
          <WordReveal
            text="Four simulation modes"
            className={demoType.stackedHeadlineLargeSplit}
            baseDelay={350}
            gradientFrom={2}
            stagger={55}
          />
          <p
            className={cn(demoType.stackedDescSplit, demoTheme.muted)}
            style={anim("demo-fade-up", 700)}
          >
            Practice, learn, evaluate, or shadow AI patient cases.
          </p>
        </header>
      }
      visual={
        showHub ? (
          <ModesHubUiScreenshot
            className="h-full min-h-0 w-full"
            style={anim("demo-fade-in", 0, "0.75s")}
          />
        ) : null
      }
    />
  );
}

function getMode(id: MedPrepModeId) {
  return MEDPREP_MODES.find((m) => m.id === id)!;
}

export function CaseGenerationScene() {
  const show = useDelayedFlag(400);
  return (
    <SplitCopyVisualSlide
      header={
        <header className={SPLIT_HEADER}>
          <SceneTag icon={Sparkles} label={`${AI_SIMULATION_MODULE} · System`} delayMs={150} />
          <WordReveal
            text="Dynamic case generation built in"
            className={demoType.stackedHeadlineLargeSplit}
            baseDelay={350}
            gradientFrom={3}
            stagger={55}
          />
          <p
            className={cn(demoType.stackedDescSplit, demoTheme.muted)}
            style={anim("demo-fade-up", 700)}
          >
            Generate by specialty, difficulty, and type — or browse the library.
          </p>
        </header>
      }
      visual={
        show ? (
          <CaseGenerationUiScreenshot
            className="h-full min-h-0 w-full"
            style={anim("demo-fade-in", 0, "0.75s")}
          />
        ) : null
      }
    />
  );
}

export function PracticeModeScene() {
  const m = getMode("let-me-drive");
  return (
    <ModeSceneLayout
      tagIcon={Stethoscope}
      tagLabel={`${AI_SIMULATION_MODULE} · ${m.title}`}
      headline="Lead the encounter yourself"
      description={m.summary}
      bullets={m.highlights.map((h) => `${h.title}: ${h.subtitle}`)}
      snapshot={<PracticeModeSnapshot />}
    />
  );
}

export function LearningModeScene() {
  const m = getMode("qa");
  return (
    <ModeSceneLayout
      tagIcon={BookOpen}
      tagLabel={`${AI_SIMULATION_MODULE} · ${m.title}`}
      headline="Learn with AI coaching"
      description={m.summary}
      bullets={m.highlights.map((h) => `${h.title}: ${h.subtitle}`)}
      snapshot={<LearningModeSnapshot />}
    />
  );
}

export function EvaluationModeScene() {
  const m = getMode("ai-evaluation");
  return (
    <ModeSceneLayout
      tagIcon={ClipboardCheck}
      tagLabel={`${AI_SIMULATION_MODULE} · ${m.title}`}
      headline="Get OSCE style grades"
      description={m.summary}
      bullets={m.highlights.map((h) => `${h.title}: ${h.subtitle}`)}
      snapshot={<EvaluationModeSnapshot />}
    />
  );
}

export function ShadowModeScene() {
  const m = getMode("shadow-mode");
  return (
    <ModeSceneLayout
      tagIcon={Eye}
      tagLabel={`${AI_SIMULATION_MODULE} · ${m.title}`}
      headline="Watch expert reasoning unfold"
      description={m.summary}
      bullets={m.highlights.map((h) => `${h.title}: ${h.subtitle}`)}
      snapshot={<ShadowModeSnapshot />}
    />
  );
}

export function ClinicalLabCreateTestScene() {
  return (
    <ModeSceneLayout
      tagIcon={FlaskConical}
      tagLabel="Clinical Lab module"
      headline="Build the perfect block"
      description="Create custom MCQ tests from systems and topics. Filter by unused, incorrect, or marked questions. Tutor mode for explanations or timed mode for exam pace."
      bullets={[
        "Tutor mode: explanations after each question",
        "Timed mode: 90 seconds per question",
        "Systems & topics: cardiovascular, neuro, and more",
      ]}
      snapshot={<ClinicalLabCreateTestSnapshot />}
    />
  );
}

export function ClinicalLabSessionScene() {
  return (
    <ModeSceneLayout
      tagIcon={BookOpen}
      tagLabel="Clinical Lab · QBank"
      headline="High yield MCQs with feedback"
      description="Run tests in the question generator with instant tutor feedback, mark questions for review, and track accuracy by system on your performance dashboard."
      bullets={[
        "Question bank by system, topic & subtopic",
        "Mark & revisit weak areas",
        "Past tests, mock exams & analytics",
      ]}
      snapshot={<ClinicalLabSessionSnapshot />}
    />
  );
}

export function SetupScene() {
  const email = useTypewriter("alex.chen@medschool.edu", 800, 45);
  const step2 = useDelayedFlag(3200);
  const step3 = useDelayedFlag(4800);
  return (
    <SceneShell>
      <SceneTag icon={Shield} label="Institutions" delayMs={200} />
      <h2 className={demoType.setupH2} style={anim("demo-fade-up", 400)}>
        Deploy <span className="demo-text-gradient">{AI_SIMULATION_MODULE}</span> and{" "}
        <span className="demo-text-gradient">{CLINICAL_LAB_MODULE}</span>
      </h2>
      <p className={cn("mt-3 max-w-2xl text-center", demoType.bodyMuted, demoTheme.muted)} style={anim("demo-fade-up", 700)}>
        Encrypted sign-in · roster sync · faculty assignments & analytics
      </p>
      <div
        className={cn("mt-8 w-full max-w-lg p-6 sm:p-7", demoTheme.card)}
        style={anim("demo-pop", 1000)}
      >
        <label className={cn(demoType.setupLabel, demoTheme.muted)}>Institution email</label>
        <div className={cn("mt-2 flex items-center rounded-lg border border-white/15 bg-demo-900/80 px-4 py-3 font-mono text-white", demoType.setupInput)}>
          {email}
          <span className="ml-0.5 inline-block h-4 w-0.5 bg-red-400" style={{ animation: "demo-blink 1s step-end infinite" }} />
        </div>
        <ul className={cn("mt-4 space-y-2.5", demoType.setupList, demoTheme.body)}>
          {[
            { label: "Verify domain", done: step2 },
            { label: `Enable ${AI_SIMULATION_MODULE} + ${CLINICAL_LAB_MODULE}`, done: step3 },
            { label: "Publish cases & MCQ assignments", done: step3 },
          ].map((s, i) => (
            <li key={s.label} className="flex items-center gap-2" style={anim("demo-fade-up", 1400 + i * 350)}>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm sm:text-base",
                  s.done ? "bg-red-500 text-white" : "border border-white/20",
                )}
              >
                {s.done ? "✓" : i + 1}
              </span>
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </SceneShell>
  );
}

export function ImpactScene() {
  const m1 = useCountUp(2400, 2000, true);
  const m2 = useCountUp(87, 2000, true);
  const m3 = useCountUp(2, 1200, true);
  const m4 = useCountUp(18, 2000, true);
  const metrics = [
    { value: `${m1.toLocaleString()}+`, label: "Simulation encounters" },
    { value: `${m2}%`, label: "Avg. OSCE rubric gain" },
    { value: `${m3}`, label: "Platform modules" },
    { value: `${m4}%`, label: "QBank accuracy lift" },
  ];
  return (
    <SceneShell>
      <SceneTag icon={BarChart3} label="Impact" delayMs={200} />
      <WordReveal text="Train every stage of mastery" baseDelay={400} gradientFrom={1} />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {metrics.map((m, i) => (
          <div key={m.label} className="text-center" style={anim("demo-counter-pop", 900 + i * 180, "0.7s")}>
            <p className={cn(demoType.metricValue, demoTheme.stat)}>{m.value}</p>
            <p className={cn("mt-1", demoType.metricLabel, demoTheme.body)}>{m.label}</p>
          </div>
        ))}
      </div>
    </SceneShell>
  );
}

export function CtaScene() {
  return (
    <SceneShell>
      <GlowBurst delayMs={400} />
      <WordReveal text="Train cases and MCQs" baseDelay={300} gradientFrom={2} />
      <p className={cn("mt-4 max-w-2xl text-center", demoType.bodyMuted, demoTheme.muted)} style={anim("demo-fade-up", 900)}>
        {AI_SIMULATION_MODULE} for encounters · Clinical Lab for boards, one subscription, one dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3" style={anim("demo-fade-up", 1100)}>
        <span className={cn("rounded-lg", demoType.pill, demoTheme.pillPrimary)}>{AI_SIMULATION_MODULE}</span>
        <span className={cn("rounded-lg", demoType.pill, demoTheme.pillSecondary)}>{CLINICAL_LAB_MODULE}</span>
      </div>
      <div
        className={cn("mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-10 py-4 font-semibold text-white shadow-lg shadow-red-900/40 demo-cta-glow", demoType.cta)}
        style={{
          ...anim("demo-pop", 1400),
          animation: "demo-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1400ms both, demo-cta-glow 2.5s ease-in-out 2s infinite",
        }}
      >
        Start free trial
        <ArrowRight className="h-6 w-6" />
      </div>
      <p className={cn("mt-4 font-mono text-red-400/90", demoType.footer)} style={anim("demo-fade-in", 1800)}>
        app · {AI_SIMULATION_MODULE} + {CLINICAL_LAB_MODULE} · free trial
      </p>
    </SceneShell>
  );
}


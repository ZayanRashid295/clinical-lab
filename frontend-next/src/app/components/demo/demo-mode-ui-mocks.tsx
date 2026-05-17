"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  BookOpen,
  Brain,
  ClipboardCheck,
  Eye,
  Lightbulb,
  MessageCircle,
  Play,
  Send,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { APP_DISPLAY_NAME } from "@/app/config/brand";
import { anim } from "./demo-primitives";

type ActiveMode = "practice" | "learning" | "evaluation" | "shadow";

const SIDEBAR_MODES: { id: ActiveMode; label: string }[] = [
  { id: "practice", label: "Practice Mode" },
  { id: "learning", label: "Learning Mode" },
  { id: "evaluation", label: "AI Evaluation Mode" },
  { id: "shadow", label: "Shadow Mode" },
];

function MockSidebar({ active }: { active: ActiveMode }) {
  return (
    <aside className="flex w-[4.5rem] shrink-0 flex-col border-r border-red-900/80 bg-gradient-to-b from-red-900 to-red-950 sm:w-[5.5rem] lg:w-[6.25rem]">
      <div className="border-b border-red-800/60 px-1.5 py-2 sm:px-2 sm:py-2.5">
        <p className="truncate text-xl font-bold text-white sm:text-2xl">{APP_DISPLAY_NAME}</p>
        <p className="truncate text-lg text-red-200/70 sm:text-xl">Student</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-hidden p-1 sm:p-1.5">
        <span className="px-1 text-xl font-bold uppercase tracking-wider text-red-300/50 sm:text-2xl">
          MedPrepAI
        </span>
        {SIDEBAR_MODES.map((m) => (
          <span
            key={m.id}
            className={cn(
              "truncate rounded px-1 py-1 text-lg font-medium sm:text-xl",
              active === m.id
                ? "bg-red-500/40 text-white ring-1 ring-red-400/40"
                : "text-red-100/60",
            )}
          >
            {m.label.replace(" Mode", "").replace("AI ", "")}
          </span>
        ))}
      </nav>
    </aside>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  headerClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof Stethoscope;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-white/10 bg-zinc-900/80",
        className,
      )}
    >
      <header
        className={cn(
          "shrink-0 border-b border-white/10 bg-zinc-950/80 px-2 py-1.5 sm:px-2.5 sm:py-2",
          headerClassName,
        )}
      >
        <div className="flex items-center gap-1.5">
          {Icon ? <Icon className="h-3 w-3 shrink-0 text-red-400 sm:h-3.5 sm:w-3.5" /> : null}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white sm:text-xl">{title}</p>
            {subtitle ? (
              <p className="truncate text-lg text-zinc-500 sm:text-xl">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden p-2 sm:p-2.5">{children}</div>
    </section>
  );
}

function ModeUiShell({
  active,
  children,
  className,
  style,
}: {
  active: ActiveMode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 overflow-hidden rounded-lg bg-zinc-950 text-left",
        className,
      )}
      style={style}
    >
      <MockSidebar active={active} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function CaseHeader({
  title,
  patient,
  badge,
  action,
}: {
  title: string;
  patient: string;
  badge?: string;
  action?: string;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-zinc-950/90 px-2 py-1.5 sm:px-3 sm:py-2">
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-red-400 sm:text-xl">{title}</p>
        <p className="truncate text-xl text-zinc-400 sm:text-2xl">{patient}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {badge ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-lg font-semibold text-amber-200 sm:text-xl">
            {badge}
          </span>
        ) : null}
        {action ? (
          <span className="rounded-md bg-red-600 px-2 py-0.5 text-lg font-semibold text-white sm:text-xl">
            {action}
          </span>
        ) : null}
      </div>
    </header>
  );
}

/** Practice Mode — 4-column encounter UI */
export function PracticeModeUiMock({ style }: { style?: CSSProperties }) {
  return (
    <ModeUiShell active="practice" style={style}>
      <CaseHeader
        title="Persistent Fatigue and Joint Pain"
        patient="Patient: Sarah Chen"
        badge="Intermediate"
        action="Complete Case"
      />
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1.5 p-1.5 sm:gap-2 sm:p-2">
        <Panel title="Patient Consultation" subtitle="AI patient chat" icon={MessageCircle}>
          <div
            className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-black/30 px-2 text-center"
            style={anim("demo-fade-in", 500)}
          >
            <User className="mb-1.5 h-6 w-6 text-zinc-600" />
            <p className="text-xl leading-snug text-zinc-500 sm:text-2xl">
              Start by asking the patient a question
            </p>
          </div>
          <div className="mt-auto flex gap-1 pt-2">
            <span className="min-w-0 flex-1 truncate rounded border border-white/10 bg-zinc-800 px-1.5 py-1 text-lg text-zinc-500">
              Ask the patient…
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
              <Send className="h-2.5 w-2.5 text-white" />
            </span>
          </div>
        </Panel>

        <Panel
          title="AI Assistant"
          subtitle="Clinical guidance"
          icon={Sparkles}
          headerClassName="border-red-500/20 bg-red-950/30"
        >
          <div className="space-y-1.5" style={anim("demo-fade-up", 600)}>
            <div className="rounded border border-white/10 bg-white/[0.04] p-1.5">
              <p className="text-xl font-semibold text-red-300">Clinical Tips</p>
              <p className="mt-0.5 text-lg leading-snug text-zinc-400">
                Focus on onset, duration, severity of symptoms.
              </p>
            </div>
            <div className="rounded border border-white/10 bg-white/[0.04] p-1.5">
              <p className="text-xl font-semibold text-zinc-200">Key areas</p>
              <ul className="mt-0.5 space-y-0.5 text-lg text-zinc-500">
                <li>• Symptom characteristics</li>
                <li>• Associated symptoms</li>
                <li>• Medical & family history</li>
              </ul>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-950/30 p-1.5">
              <p className="text-xl font-semibold text-amber-300">Red flags</p>
              <p className="mt-0.5 text-lg text-amber-200/80">Watch for serious conditions</p>
            </div>
          </div>
        </Panel>

        <Panel title="Smart Suggestions" subtitle="AI question hints" icon={Lightbulb}>
          <div
            className="flex h-full flex-col items-center justify-center rounded-md bg-gradient-to-b from-red-950/50 to-zinc-950 p-2 text-center"
            style={anim("demo-pop", 700)}
          >
            <span className="mb-1.5 flex h-8 w-14 items-center justify-center rounded-full bg-red-600/80">
              <span className="text-xl font-bold text-white">?</span>
            </span>
            <p className="text-xl font-semibold text-white sm:text-2xl">Get AI Question Hints</p>
            <p className="mt-1 text-lg leading-snug text-zinc-500">
              Tailored suggestions for this case
            </p>
          </div>
        </Panel>

        <Panel title="Case Information" subtitle="Patient & progress" icon={BookOpen}>
          <div className="space-y-1.5 text-lg sm:text-xl" style={anim("demo-slide-left", 800)}>
            <div>
              <p className="font-semibold text-zinc-300">Sarah Chen · 32F</p>
              <p className="text-zinc-500">Chief: Fatigue</p>
            </div>
            <div className="rounded border border-white/10 bg-black/30 p-1.5">
              <p className="text-zinc-400">Symptoms</p>
              <p className="text-zinc-300">Fatigue, arthralgia, malaise</p>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { l: "Quality", v: "0%" },
                { l: "Questions", v: "0" },
                { l: "Time", v: "0m" },
              ].map((s) => (
                <div key={s.l} className="rounded bg-white/5 py-1">
                  <p className="font-bold text-white">{s.v}</p>
                  <p className="text-xl text-zinc-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </ModeUiShell>
  );
}

/** Learning Mode — patient chart + nurse report + consultation */
export function LearningModeUiMock({ style }: { style?: CSSProperties }) {
  return (
    <ModeUiShell active="learning" style={style}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-zinc-950/90 px-2 py-1.5 sm:px-3">
        <div className="min-w-0">
          <p className="text-lg text-zinc-500">Learning Simulator</p>
          <p className="truncate text-lg font-semibold text-white sm:text-xl">
            COPD Exacerbation — Faculty Case
          </p>
        </div>
        <span
          className="rounded-md bg-red-600 px-2 py-1 text-lg font-semibold text-white sm:text-xl"
          style={anim("demo-pop", 450)}
        >
          Start Simulation
        </span>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 p-1.5 sm:gap-2 sm:p-2">
        <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
          {[
            { t: "Robert Chen", s: "62M · Retired teacher", accent: true },
            { t: "Medical History", s: "HTN, T2DM, prior pneumonia" },
            { t: "Social History", s: "Former smoker · married" },
            { t: "Family History", s: "Mother — asthma" },
          ].map((c, i) => (
            <div
              key={c.t}
              className={cn(
                "shrink-0 rounded-md border p-1.5 sm:p-2",
                c.accent
                  ? "border-red-500/30 bg-red-950/25"
                  : "border-white/10 bg-zinc-900/60",
              )}
              style={anim("demo-fade-up", 500 + i * 80)}
            >
              {c.accent ? (
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
                    R
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-white">{c.t}</p>
                    <p className="text-lg text-zinc-400">{c.s}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xl font-semibold text-zinc-200">{c.t}</p>
                  <p className="text-lg text-zinc-500">{c.s}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <Panel title="Nurse Report" subtitle="Handoff & vitals" icon={ClipboardCheck}>
          <div className="space-y-1 overflow-y-auto">
            {[
              { h: "Chief complaint", b: "Persistent cough" },
              { h: "Symptoms", b: "SOB, wheezing" },
              { h: "Vitals", b: "BP 138/85 · HR 105 · Temp 99.8°F" },
              { h: "Assessment", b: "Subacute · moderate severity" },
            ].map((n, i) => (
              <div
                key={n.h}
                className="rounded border border-white/10 bg-black/25 p-1.5"
                style={anim("demo-slide-right", 600 + i * 70)}
              >
                <p className="text-xl font-semibold text-red-300/90">{n.h}</p>
                <p className="text-lg text-zinc-400">{n.b}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI Consultation" subtitle="Conversation · SOAP" icon={MessageCircle}>
          <div className="mb-1.5 flex gap-1">
            <span className="rounded bg-blue-600/80 px-2 py-0.5 text-lg font-semibold text-white">
              Conversation
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-lg text-zinc-500">SOAP Note</span>
          </div>
          <div
            className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-black/20 py-4 text-center"
            style={anim("demo-fade-in", 900)}
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90">
              <MessageCircle className="h-5 w-5 text-white" />
            </span>
            <p className="text-xl font-semibold text-white">Ready to Start</p>
            <p className="mt-1 max-w-[12rem] text-lg leading-snug text-zinc-500">
              Click Start Simulation to begin the AI consultation
            </p>
          </div>
          <span className="mt-auto inline-flex w-full justify-end">
            <span className="rounded-md bg-red-600 px-2 py-1 text-lg font-semibold text-white">
              Ask Doctor
            </span>
          </span>
        </Panel>
      </div>
    </ModeUiShell>
  );
}

/** AI Evaluation Mode — case + doctor mind + learning insights */
export function EvaluationModeUiMock({ style }: { style?: CSSProperties }) {
  return (
    <ModeUiShell active="evaluation" style={style}>
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/90 px-2 py-1.5 sm:px-3">
        <p className="text-xl font-bold text-white sm:text-2xl">AI Evaluation Mode</p>
        <p className="text-lg text-zinc-500 sm:text-xl">
          Abdominal Pain Case · 28yo · Ready for evaluation
        </p>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 p-1.5 sm:gap-2 sm:p-2">
        <div className="flex min-h-0 flex-col gap-1">
          <div
            className="rounded-md border border-violet-500/25 bg-violet-950/20 p-1.5 sm:p-2"
            style={anim("demo-fade-up", 500)}
          >
            <div className="grid grid-cols-3 gap-1 text-center text-xl sm:text-2xl">
              {[
                ["Age", "28"],
                ["Symptoms", "4"],
                ["Difficulty", "Beginner"],
              ].map(([l, v]) => (
                <div key={l} className="rounded bg-black/30 py-1">
                  <p className="text-zinc-500">{l}</p>
                  <p className="font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xl font-semibold text-white">Sarah Johnson · Teacher</p>
            <div className="mt-1 flex flex-wrap gap-0.5">
              {["abdominal pain", "fever", "nausea"].map((t) => (
                <span
                  key={t}
                  className="rounded bg-zinc-800 px-1 py-0.5 text-xl text-zinc-300 sm:text-2xl"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col rounded-md border border-white/10 bg-zinc-900/60 p-2">
            <p className="text-xl text-zinc-500">Consultation</p>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-lg text-zinc-600">Ask the patient a question…</p>
            </div>
            <div className="mt-1 flex gap-1">
              <span className="flex-1 rounded border border-white/10 bg-zinc-800 px-1 py-1 text-lg text-zinc-500">
                Type here…
              </span>
              <span className="rounded bg-red-600 px-1.5 py-1">
                <Send className="h-2.5 w-2.5 text-white" />
              </span>
            </div>
          </div>
        </div>

        <Panel
          title="Doctor Mind"
          subtitle="Clinical reasoning"
          icon={Brain}
          headerClassName="border-emerald-500/25 bg-emerald-950/20"
        >
          <div
            className="flex h-full flex-col items-center justify-center text-center"
            style={anim("demo-fade-in", 700)}
          >
            <Brain className="mb-1.5 h-7 w-7 text-emerald-500/50" />
            <p className="text-xl text-emerald-200/70">Start conversation to see reasoning</p>
          </div>
        </Panel>

        <Panel
          title="Learning Insights"
          subtitle="Educational content"
          icon={BookOpen}
          headerClassName="border-violet-500/25 bg-violet-950/25"
        >
          <div className="mb-1 flex flex-wrap gap-0.5">
            {["Content", "Nurse", "Key pts", "Guidelines"].map((t, i) => (
              <span
                key={t}
                className={cn(
                  "rounded px-1 py-0.5 text-xl sm:text-2xl",
                  i === 0 ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-500",
                )}
              >
                {t}
              </span>
            ))}
          </div>
          <ul className="space-y-0.5 text-lg text-zinc-400 sm:text-xl" style={anim("demo-slide-left", 850)}>
            <li>• Develop differential diagnosis skills</li>
            <li>• What brings you in today?</li>
            <li>• Any medical history?</li>
            <li>• Systematic history taking</li>
          </ul>
          <div className="mt-1.5 rounded border border-emerald-500/20 bg-emerald-950/20 p-1.5">
            <p className="text-lg font-semibold text-emerald-300">Skills to practice</p>
            <p className="text-xl text-zinc-500">HPI · ROS · physical exam</p>
          </div>
        </Panel>
      </div>
    </ModeUiShell>
  );
}

/** Shadow Mode — dual AI agents + supervisor + differentials */
export function ShadowModeUiMock({ style }: { style?: CSSProperties }) {
  const diffs = [
    { label: "Primary Diagnosis", pct: 72, tone: "bg-emerald-500" },
    { label: "Secondary", pct: 18, tone: "bg-amber-500" },
    { label: "Rare condition", pct: 6, tone: "bg-zinc-500" },
    { label: "Rule out", pct: 4, tone: "bg-red-500" },
  ];

  return (
    <ModeUiShell active="shadow" style={style}>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-zinc-950/90 px-2 py-1.5 sm:px-3">
        <div>
          <p className="text-xl font-bold text-white sm:text-2xl">Shadow Mode</p>
          <p className="text-lg text-zinc-500">Supervised clinical interview</p>
        </div>
        <div className="flex gap-1">
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-lg text-emerald-200">
            Chest Pain
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5 text-lg text-zinc-400">
            Intermediate
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-1.5 sm:gap-2 sm:p-2">
        <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:gap-2">
          {[
            { role: "AI Doctor", color: "from-blue-600 to-blue-800" },
            { role: "AI Patient", color: "from-emerald-600 to-emerald-800" },
          ].map((a, i) => (
            <div
              key={a.role}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900/80 p-1.5 sm:p-2"
              style={anim("demo-fade-up", 450 + i * 100)}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white sm:h-8 sm:w-8",
                  a.color,
                )}
              >
                {a.role === "AI Doctor" ? "Dr" : "Pt"}
              </span>
              <div>
                <p className="text-xl font-semibold text-white sm:text-2xl">{a.role}</p>
                <p className="text-xl text-emerald-400">● online</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
          <Panel title="Live Conversation" subtitle="Initial consultation" icon={Users}>
            <div
              className="flex h-full flex-col items-center justify-center rounded-md bg-black/25 py-3 text-center"
              style={anim("demo-fade-in", 650)}
            >
              <span className="mb-1.5 flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-lg font-semibold text-white">
                <Play className="h-2.5 w-2.5" />
                Start Simulation
              </span>
              <p className="text-lg text-zinc-500">Click to begin conversation</p>
            </div>
          </Panel>

          <div className="flex min-h-0 flex-col gap-1">
            <Panel title="Doctor's Thought" icon={Brain} className="flex-[0.9]">
              <p className="text-lg text-zinc-600">Reasoning appears during simulation</p>
            </Panel>
            <Panel
              title="AI Supervisor"
              subtitle="Active · 0 interventions"
              icon={Eye}
              className="flex-1"
              headerClassName="border-violet-500/20 bg-violet-950/20"
            >
              <p className="text-lg leading-snug text-violet-200/80">
                AI doctor continues automatically. No interventions yet.
              </p>
            </Panel>
          </div>

          <Panel title="Differential Diagnosis" icon={Activity}>
            <div className="space-y-1.5">
              {diffs.map((d, i) => (
                <div key={d.label} style={anim("demo-slide-left", 750 + i * 80)}>
                  <div className="mb-0.5 flex justify-between text-lg sm:text-xl">
                    <span className="text-zinc-300">{d.label}</span>
                    <span className="font-semibold text-white">{d.pct}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={cn("h-full rounded-full", d.tone)}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ModeUiShell>
  );
}

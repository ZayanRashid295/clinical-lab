import type { ComponentType } from "react";
import {
  CaseGenerationScene,
  ClinicalLabCreateTestScene,
  ClinicalLabSessionScene,
  CtaScene,
  EvaluationModeScene,
  ImpactScene,
  LearningModeScene,
  ModesHubScene,
  PlatformOverviewScene,
  PracticeModeScene,
  ProblemScene,
  SetupScene,
  ShadowModeScene,
  TitleScene,
} from "./demo-scenes";

export type DemoSceneDef = {
  id: string;
  title: string;
  duration: number;
  Component: ComponentType;
  notes: string;
};

/** ~113s: platform (2 modules) → AI Simulation (hub, case gen, 4 modes) → Clinical Lab → CTA */
export const DEMO_SCENES: DemoSceneDef[] = [
  {
    id: "title",
    title: "Intro",
    duration: 9000,
    Component: TitleScene,
    notes:
      "Full-bleed intro with hero photo, ideal for open-house projection. MedPrepAI is one platform: AI Simulation (four modes) plus Clinical Lab (MCQs). Press H to hide chrome for a clean fullscreen slide.",
  },
  {
    id: "problem",
    title: "Problem",
    duration: 7000,
    Component: ProblemScene,
    notes:
      "Students need bedside reps and board-style MCQs, but tools are fragmented. Faculty can't scale observation across simulations and question banks. MedPrepAI unifies both under one login.",
  },
  {
    id: "platform",
    title: "Two modules",
    duration: 9000,
    Component: PlatformOverviewScene,
    notes:
      "Show the two pillars: AI Simulation (four simulation modes with AI patients and OSCE rubrics). Clinical Lab (Create Test, question pools, tutor/timed modes, and performance analytics). Same institution, same dashboard.",
  },
  {
    id: "medprep-hub",
    title: "AI Simulation hub",
    duration: 9000,
    Component: ModesHubScene,
    notes:
      "Inside the AI Simulation module, learners pick Practice, Learning, AI Evaluation, or Shadow, the same four cards they see on /medprep-ai. Resume sessions appear above the mode grid.",
  },
  {
    id: "case-generation",
    title: "Dynamic case generation",
    duration: 8000,
    Component: CaseGenerationScene,
    notes:
      "Dynamic case generation is enabled system-wide. Generate New Case: specialty, difficulty, rare disease toggle, and case types. Browse Cases: pre-built library across specialties. Same entry in Practice, Learning, Evaluation, and Shadow.",
  },
  {
    id: "practice",
    title: "Practice Mode",
    duration: 8000,
    Component: PracticeModeScene,
    notes:
      "Practice Mode: independent encounters, no hints. Read the nurse report, interview the AI patient, work up the case, and submit SOAP documentation to build confidence before clerkships.",
  },
  {
    id: "learning",
    title: "Learning Mode",
    duration: 8000,
    Component: LearningModeScene,
    notes:
      "Learning Mode adds AI coaching: objectives, hints, ask-the-doctor explanations. The bridge between shadowing an expert and performing solo.",
  },
  {
    id: "evaluation",
    title: "AI Evaluation",
    duration: 8000,
    Component: EvaluationModeScene,
    notes:
      "AI Evaluation Mode delivers OSCE-aligned letter grades and competency breakdowns, ideal for formative assessments before shelf or OSCE week.",
  },
  {
    id: "shadow",
    title: "Shadow Mode",
    duration: 9000,
    Component: ShadowModeScene,
    notes:
      "Shadow Mode: watch an AI attending, see internal reasoning and differentials, replay the timeline, and ask why for pattern recognition without being in the hot seat.",
  },
  {
    id: "clinical-lab-create",
    title: "Clinical Lab · Create Test",
    duration: 9000,
    Component: ClinicalLabCreateTestScene,
    notes:
      "Clinical Lab is the QBank module. Create Test lets students pick tutor or timed mode, filter unused/incorrect/marked pools, and select systems and topics (cardiovascular, neuro, and more), then generate a custom block.",
  },
  {
    id: "clinical-lab-session",
    title: "Clinical Lab · MCQs",
    duration: 9000,
    Component: ClinicalLabSessionScene,
    notes:
      "Run the test in tutor mode: answer MCQs, get immediate explanations, mark weak items, and track accuracy by system on the performance dashboard. Past tests and mock exams live here too.",
  },
  {
    id: "setup",
    title: "Institutions",
    duration: 8000,
    Component: SetupScene,
    notes:
      "Institutions enable both modules for a cohort: domain verification, roster sync, faculty cases, and MCQ assignments. FERPA-aligned deployment.",
  },
  {
    id: "impact",
    title: "Impact",
    duration: 7000,
    Component: ImpactScene,
    notes:
      "Programs measure simulation volume, rubric gains, unified modules, and QBank accuracy improvements across cases and MCQs.",
  },
  {
    id: "cta",
    title: "Get started",
    duration: 7000,
    Component: CtaScene,
    notes:
      "Close: start a free trial. Suggest trying one shadow case and one Create Test block. Most schools use both modules across the curriculum.",
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce((s, sc) => s + sc.duration, 0);

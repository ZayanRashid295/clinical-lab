import { Brain, FlaskConical, type LucideIcon } from "lucide-react";
import { AI_SIMULATION_MODULE, CLINICAL_LAB_MODULE } from "./demo-constants";

export type PlatformModuleId = "ai-simulation" | "clinical-lab";

export interface PlatformModuleDef {
  id: PlatformModuleId;
  name: string;
  eyebrow: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  accentBar: string;
  iconWrap: string;
}

export const PLATFORM_MODULES: PlatformModuleDef[] = [
  {
    id: "ai-simulation",
    name: AI_SIMULATION_MODULE,
    eyebrow: "Clinical simulation",
    description:
      "AI patient encounters in four modes: practice solo, learn with coaching, get OSCE-style evaluation, or shadow expert reasoning.",
    bullets: [
      "Practice, Learning, Evaluation & Shadow modes",
      "SOAP notes & competency rubrics",
      "Faculty assignments & cohort analytics",
    ],
    icon: Brain,
    accentBar: "from-red-500 via-red-600 to-red-800",
    iconWrap: "bg-red-500/15 text-red-300 ring-red-500/25",
  },
  {
    id: "clinical-lab",
    name: CLINICAL_LAB_MODULE,
    eyebrow: "QBank & MCQ assessments",
    description:
      "High-yield question bank with custom tests. Filter by system and topic, tutor or timed modes, and track performance over time.",
    bullets: [
      "Create Test · systems, topics, pools",
      "Tutor explanations or timed blocks",
      "Past tests, mock exams & analytics",
    ],
    icon: FlaskConical,
    accentBar: "from-red-800 via-red-600 to-red-500",
    iconWrap: "bg-red-800/20 text-red-200 ring-red-700/30",
  },
];

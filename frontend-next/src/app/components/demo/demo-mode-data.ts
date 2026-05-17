import type { MedPrepModeId } from "@/app/components/medprep-ai/modes";
import { MEDPREP_MODES } from "@/app/components/medprep-ai/modes";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  Crown,
  Eye,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
} from "lucide-react";

export { MEDPREP_MODES };
export type { MedPrepModeId };

/** Dark glass cards — red accent bars differentiate modes. */
export const DEMO_MODE_THEME: Record<
  MedPrepModeId,
  {
    topBar: string;
    iconWrap: string;
    highlightRing: string;
    highlightIcon: string;
    cardBorder: string;
    cardBg: string;
    cta: string;
    resumeBadge: string;
    accent: string;
  }
> = {
  "let-me-drive": {
    topBar: "from-red-500 via-red-600 to-red-700",
    iconWrap: "bg-red-500/15 text-red-300 ring-red-500/30 ring-offset-black",
    highlightRing: "ring-white/10 bg-white/5",
    highlightIcon: "text-red-400",
    cardBorder: "border-red-500/15",
    cardBg: "bg-zinc-950/90",
    cta: "from-red-600 to-red-700",
    resumeBadge: "bg-red-500/15 text-red-200 border-red-500/25",
    accent: "red",
  },
  qa: {
    topBar: "from-rose-500 via-red-500 to-red-600",
    iconWrap: "bg-rose-500/15 text-rose-300 ring-rose-500/30 ring-offset-black",
    highlightRing: "ring-white/10 bg-white/5",
    highlightIcon: "text-rose-400",
    cardBorder: "border-red-500/15",
    cardBg: "bg-zinc-950/90",
    cta: "from-rose-600 to-red-600",
    resumeBadge: "bg-rose-500/15 text-rose-200 border-rose-500/25",
    accent: "rose",
  },
  "ai-evaluation": {
    topBar: "from-red-700 via-red-600 to-rose-600",
    iconWrap: "bg-red-700/20 text-red-200 ring-red-700/35 ring-offset-black",
    highlightRing: "ring-white/10 bg-white/5",
    highlightIcon: "text-red-300",
    cardBorder: "border-red-500/15",
    cardBg: "bg-zinc-950/90",
    cta: "from-red-700 to-red-800",
    resumeBadge: "bg-red-800/25 text-red-100 border-red-700/30",
    accent: "crimson",
  },
  "shadow-mode": {
    topBar: "from-red-900 via-red-700 to-red-500",
    iconWrap: "bg-red-900/25 text-red-200 ring-red-800/35 ring-offset-black",
    highlightRing: "ring-white/10 bg-white/5",
    highlightIcon: "text-red-400",
    cardBorder: "border-red-500/15",
    cardBg: "bg-zinc-950/90",
    cta: "from-red-800 to-red-600",
    resumeBadge: "bg-red-900/30 text-red-200 border-red-800/35",
    accent: "dark-red",
  },
};

export const DEMO_MODE_ICONS: Record<MedPrepModeId, LucideIcon> = {
  "let-me-drive": Stethoscope,
  qa: BookOpen,
  "ai-evaluation": ClipboardCheck,
  "shadow-mode": Eye,
};

export const DEMO_HIGHLIGHT_ICONS: Record<
  MedPrepModeId,
  [LucideIcon, LucideIcon, LucideIcon]
> = {
  "let-me-drive": [BookOpen, Clock, Target],
  qa: [GraduationCap, MessageCircle, Sparkles],
  "ai-evaluation": [ClipboardCheck, Crown, TrendingUp],
  "shadow-mode": [Eye, MessageCircle, Sparkles],
};

export const DEMO_RESUME_SESSIONS = [
  { title: "COPD Exacerbation", mode: "LEARNING" as const, badge: "qa" as MedPrepModeId },
  { title: "Myocardial Infarction", mode: "SHADOW" as const, badge: "shadow-mode" as MedPrepModeId },
  { title: "Appendicitis", mode: "PRACTICE" as const, badge: "let-me-drive" as MedPrepModeId },
];

export const DEMO_CASE_USAGE: Record<MedPrepModeId, number> = {
  "let-me-drive": 7,
  qa: 3,
  "ai-evaluation": 2,
  "shadow-mode": 6,
};

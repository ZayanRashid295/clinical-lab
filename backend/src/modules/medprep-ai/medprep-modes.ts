/** Mirrors `frontend-next/.../medprep-ai/modes.ts` for API responses. */

export const MEDPREP_MODES = [
  {
    id: "let-me-drive",
    title: "Practice Mode",
    heroHeadline: "Master Clinical Skills Through Independent Practice",
    summary:
      "Independent practice sessions to develop your clinical skills. Work through cases at your own pace without guidance, focusing on building diagnostic reasoning and patient communication abilities.",
    highlights: [
      { title: "Independent Learning", subtitle: "Practice without guidance" },
      { title: "Self-Paced Practice", subtitle: "Learn at your own speed" },
      { title: "Skill Building", subtitle: "Develop clinical abilities" },
    ],
    ctaLabel: "Start Practice",
    standaloneAppPath: "/practice-mode",
  },
  {
    id: "qa",
    title: "Learning Mode",
    heroHeadline: "Master Clinical Skills Through Guided Practice",
    summary:
      "Guided learning sessions with AI support and educational feedback. Work through cases with real-time guidance, ask questions to AI doctors, and receive detailed explanations to enhance your clinical reasoning skills.",
    highlights: [
      { title: "Guided Learning", subtitle: "AI-supported education" },
      { title: "Interactive Cases", subtitle: "Real-time feedback" },
      { title: "Educational Support", subtitle: "Detailed explanations" },
    ],
    ctaLabel: "Start Learning",
    standaloneAppPath: "/learning-mode",
  },
  {
    id: "ai-evaluation",
    title: "AI Evaluation Mode",
    heroHeadline: "Master Clinical Skills Through AI-Powered Assessment",
    summary:
      "Comprehensive AI assessment of your clinical performance. Receive detailed scoring, feedback on your diagnostic reasoning, and personalized improvement suggestions to enhance your medical skills.",
    highlights: [
      { title: "AI Assessment", subtitle: "Comprehensive evaluation" },
      { title: "Detailed Scoring", subtitle: "A-F grade feedback" },
      { title: "Improvement Insights", subtitle: "Personalized suggestions" },
    ],
    ctaLabel: "Start Evaluation",
    standaloneAppPath: "/evaluation",
  },
] as const;

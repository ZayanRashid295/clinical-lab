/** Display names for demo copy (module labels in the UI). */
export const AI_SIMULATION_MODULE = "AI Simulation";
export const CLINICAL_LAB_MODULE = "Clinical Lab";

/** Intro slide — short feature lines (paired with icons in title hero). */
export const DEMO_INTRO_FEATURES = [
  {
    title: "Four simulation modes",
    line: "Learn, practice, evaluate, and shadow AI faculty",
  },
  {
    title: "Dynamic patient cases",
    line: "AI encounters with coaching and SOAP feedback",
  },
  {
    title: "Clinical Lab QBank",
    line: "High-yield MCQs, mocks, and progress analytics",
  },
] as const;

/** Full-bleed intro hero (landing asset). */
export const DEMO_HERO_IMAGE =
  "/images/Medical_students_AI_learning_collaboration_6db2826f.png";

/** Four simulation mode cards (Four simulation modes slide). */
export const DEMO_MODES_HUB_UI_IMAGE = "/demo/medprepai-modes.png";

/** Generate New Case / Browse Cases UI (dynamic case generation). */
export const DEMO_CASE_GENERATION_UI_IMAGE = "/demo/case-generation-ui.png";

/** Clinical Lab Create Test UI screenshot. */
export const DEMO_CLINICAL_LAB_CREATE_UI_IMAGE = "/demo/create-test-reference.png";

/** Full image visible below header + demo player chrome */
export const DEMO_MODES_HUB_SLIDE_MAX_HEIGHT = "min(calc(100dvh - 7.5rem), 698px)";
export const DEMO_CASE_GEN_SHOT_MAX_HEIGHT = "min(calc(100dvh - 12.5rem), 440px)";

export const DEMO_SCREENSHOT_SIZES = {
  modesHub: { width: 934, height: 698 },
  caseGeneration: { width: 824, height: 380 },
  clinicalLabCreate: { width: 1024, height: 624 },
} as const;

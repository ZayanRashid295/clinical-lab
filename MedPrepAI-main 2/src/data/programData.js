// Central place for everything that differs between the FCPS-1 and JCAT pages.
// Update copy here instead of editing the page files directly.

export const PROGRAMS = {
  fcps: {
    slug: "fcps",
    badge: "FCPS-1",
    heroSubtitle:
      "Thousands of postgraduate candidates rely on our platform for focused, high-yield FCPS-1 preparation. We combine a rigorous question bank with in-depth explanations to develop lasting clinical knowledge and exam confidence.",
    stats: [
      { num: "3,000+", label: "Questions at Exam-Level Difficulty" },
      { num: "100%", label: "Options Explained for Every MCQ" },
      { num: "Scenario", label: "Based QBank with Full Explanations" },
      { num: "Live", label: "Analytics to Track Your Performance" },
    ],
    cards: [
      { title: "3,000+ Options Explained", desc: "Every MCQ option explained at real FCPS-1 exam difficulty, covering the complete syllabus." },
      { title: "Every Option Explained", desc: "Understand precisely why each answer is correct or incorrect, not merely which option to select." },
      { title: "Scenario-Based QBank", desc: "Clinical case scenarios with complete option-level explanations, mirroring FCPS-1 exam format." },
      { title: "Exam-Like Interface", desc: "Practice within an interface that replicates the actual FCPS-1 examination environment." },
      { title: "Performance Analytics", desc: "Monitor your scores, identify weak topics, and track measurable improvement across sessions." },
    ],
    qbankHeading: "What to Expect from Your FCPS-1 Question Bank",
    qbankText: "Our FCPS-1 QBank gives you full control over what you study and how you study it. Build custom tests from 3,000+ practice questions and get comfortable with what you'll face on exam day.",
    resourcesHeading: "FCPS-1 Resources to Boost Your Confidence",
    resourcesText: "Fill in knowledge gaps and sharpen your clinical reasoning as you build toward exam day.",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks that mirror the real FCPS-1 screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, so you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations that make complex clinical concepts easier to retain." },
    ],
    // Note: images live in src/assets/fcps/ and are imported directly in
    // pages/FCPS.jsx — see the asset table for the full FCPS-1 image list.
  },

  jcat: {
    slug: "jcat",
    badge: "JCAT (MDMS)",
    heroSubtitle:
      "Purpose-built for candidates sitting the MDMS entrance exam. Scenario-heavy questions and full answer breakdowns build the clinical reasoning JCAT (MDMS) tests for.",
    stats: [
      { num: "3,000+", label: "Questions at Exam-Level Difficulty" },
      { num: "100%", label: "Options Explained for Every MCQ" },
      { num: "Scenario", label: "Based QBank with Full Explanations" },
      { num: "Live", label: "Analytics to Track Your Performance" },
    ],
    cards: [
      { title: "3,000+ Options Explained", desc: "Every MCQ option explained at real JCAT (MDMS) exam difficulty, covering the complete syllabus." },
      { title: "Every Option Explained", desc: "Understand precisely why each answer is correct or incorrect, not merely which option to select." },
      { title: "Scenario-Based QBank", desc: "Clinical case scenarios with complete option-level explanations, mirroring the MDMS entrance format." },
      { title: "Exam-Like Interface", desc: "Practice within an interface that replicates the actual JCAT (MDMS) examination environment." },
      { title: "Performance Analytics", desc: "Monitor your scores, identify weak topics, and track measurable improvement across sessions." },
    ],
    qbankHeading: "What to Expect from Your JCAT (MDMS) Question Bank",
    qbankText: "Our JCAT (MDMS) QBank gives you full control over what you study and how you study it. Build custom tests from 3,000+ practice questions and get comfortable with what you'll face on exam day.",
    resourcesHeading: "JCAT (MDMS) Resources to Boost Your Confidence",
    resourcesText: "Fill in knowledge gaps and sharpen your clinical reasoning as you build toward exam day.",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks that mirror the real JCAT (MDMS) screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, so you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations that make complex clinical concepts easier to retain." },
    ],
    // Note: images live in src/assets/jcat/ and are imported directly in
    // pages/JCAT.jsx — see the asset table for the full JCAT (MDMS) image list.
  },
};

export type ExamTrack = "fcps" | "jcat";

export interface ProgramStat {
  num: string;
  label: string;
}

export interface ProgramCard {
  title: string;
  desc: string;
}

export interface ProgramResource {
  title: string;
  desc: string;
}

export interface ProgramConfig {
  slug: ExamTrack;
  badge: string;
  heroSubtitle: string;
  stats: ProgramStat[];
  cards: ProgramCard[];
  qbankHeading: string;
  qbankText: string;
  resourcesHeading: string;
  resourcesText: string;
  resources: ProgramResource[];
}

export const PROGRAMS: Record<ExamTrack, ProgramConfig> = {
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
    qbankText:
      "Our FCPS-1 QBank gives you full control over what you study and how you study it. Build custom tests from 3,000+ practice questions and get comfortable with what you'll face on exam day.",
    resourcesHeading: "FCPS-1 Resources to Boost Your Confidence",
    resourcesText: "Fill in knowledge gaps and sharpen your clinical reasoning as you build toward exam day.",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks that mirror the real FCPS-1 screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, so you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations that make complex clinical concepts easier to retain." },
    ],
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
    qbankText:
      "Our JCAT (MDMS) QBank gives you full control over what you study and how you study it. Build custom tests from 3,000+ practice questions and get comfortable with what you'll face on exam day.",
    resourcesHeading: "JCAT (MDMS) Resources to Boost Your Confidence",
    resourcesText: "Fill in knowledge gaps and sharpen your clinical reasoning as you build toward exam day.",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks that mirror the real JCAT (MDMS) screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, so you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations that make complex clinical concepts easier to retain." },
    ],
  },
};

export const PROGRAM_FAQS: Record<ExamTrack, Array<{ q: string; a: string }>> = {
  fcps: [
    { q: "How many practice questions does the FCPS-1 QBank include?", a: "The FCPS-1 QBank includes 3,000+ questions written at or above real exam difficulty, covering every subject in the syllabus." },
    { q: "Are the questions similar to the real FCPS-1 exam?", a: "Yes. Every question is scenario-based and reviewed against the current FCPS-1 exam pattern, so difficulty and style closely mirror the real test." },
    { q: "Can I track my performance by subject?", a: "Yes. Your dashboard breaks down accuracy and time spent by subject and system, so you always know where to focus next." },
    { q: "Is there a free demo available?", a: "Yes, tap \"View Sample Questions\" above and fill in the short form to get instant access to a sample block of FCPS-1 questions." },
  ],
  jcat: [
    { q: "What does the JCAT (MDMS) QBank cover?", a: "It includes 3,000+ scenario-based questions purpose-built for the MDMS entrance exam's format and difficulty level." },
    { q: "How is JCAT prep different from FCPS-1 prep?", a: "JCAT (MDMS) questions are tuned to the entrance exam's specific scenario style and time pressure, separate from the FCPS-1 question set." },
    { q: "Does the QBank include full-length mock tests?", a: "Yes, timed mock tests replicate the real JCAT exam-day experience, including block timing and interface." },
    { q: "Is there a free demo available?", a: "Yes, tap \"View Sample Questions\" above and fill in the short form to try a sample set of JCAT questions." },
  ],
};

export const PROGRAM_TESTIMONIALS: Record<ExamTrack, Array<{ name: string; city: string; text: string }>> = {
  fcps: [
    { name: "Ayesha Raza", city: "Lahore", text: "Explanations are so clear I stopped needing separate reference books. My score jumped a full grade." },
    { name: "Hamza Sheikh", city: "Karachi", text: "Scenario-based MCQs feel exactly like the real paper. Best FCPS-1 prep I've used." },
    { name: "Sana Malik", city: "Islamabad", text: "The performance tracker showed exactly which subjects I was weak in. Huge time saver." },
    { name: "Usman Tariq", city: "Faisalabad", text: "The exam-like interface removed all the surprises on test day. I knew exactly what to expect." },
    { name: "Fatima Noor", city: "Multan", text: "Every wrong option gets explained too, not just the right one. That's what finally made concepts stick." },
    { name: "Bilal Hussain", city: "Peshawar", text: "I compared three QBanks before choosing this one. The explanations here are genuinely more thorough." },
    { name: "Mehak Aslam", city: "Rawalpindi", text: "Went from failing mocks to a comfortable pass. The subject-wise breakdown made my last month count." },
    { name: "Danish Iqbal", city: "Sialkot", text: "Clinical scenarios read like real cases, not textbook trivia. That made the material easier to remember." },
    { name: "Kiran Yousaf", city: "Hyderabad", text: "Simple, focused, and exam-accurate. Exactly what I needed during a short dedicated study period." },
  ],
  jcat: [
    { name: "Zainab Qureshi", city: "Lahore", text: "The scenario-heavy format matched JCAT perfectly. Felt fully prepared walking in." },
    { name: "Ali Hassan", city: "Rawalpindi", text: "Subject-wise breakdown helped me focus my last two weeks on exactly the right topics." },
    { name: "Mahnoor Iqbal", city: "Karachi", text: "Clear visuals in the explanations made tough concepts click much faster." },
    { name: "Saad Malik", city: "Multan", text: "The mock tests replicated the real block timing almost exactly. No surprises on exam day." },
    { name: "Hira Shahid", city: "Faisalabad", text: "I liked that every option was explained — it forced me to actually understand, not memorize." },
    { name: "Tayyab Riaz", city: "Peshawar", text: "Went through the whole QBank twice. My accuracy on weak subjects improved a lot by the second pass." },
    { name: "Areeba Nadeem", city: "Islamabad", text: "The interface is close enough to the real JCAT screen that test day felt familiar." },
    { name: "Junaid Baig", city: "Sialkot", text: "Analytics made it obvious where I was losing marks. Fixed two weak subjects in ten days." },
    { name: "Noor Fatima", city: "Hyderabad", text: "Straightforward, well-organized, and the explanations are genuinely detailed. Would recommend." },
  ],
};

export function programImageBase(track: ExamTrack): string {
  return `/images/landing-v2/${track}`;
}

/** Shared program-page assets (FCPS + JCAT use the same carousel and resource images). */
export const PROGRAM_SHARED_IMAGE_BASE = "/images/landing-v2/shared";

export const PROGRAM_QBANK_CAROUSEL = [
  {
    src: `${PROGRAM_SHARED_IMAGE_BASE}/scroller-2.jpeg`,
    alt: "Question and explanation split-screen view",
  },
  {
    src: `${PROGRAM_SHARED_IMAGE_BASE}/scroller-3.jpeg`,
    alt: "Exam-style question interface",
  },
  {
    src: `${PROGRAM_SHARED_IMAGE_BASE}/per-answer-explanation.jpeg`,
    alt: "Per-answer explanation breakdown",
  },
] as const;

/** Shared resource card images (indices 0–2). */
export const PROGRAM_RESOURCE_IMAGES_BY_INDEX: Partial<Record<number, string>> = {
  0: `${PROGRAM_SHARED_IMAGE_BASE}/dd.jpeg`,
  1: `${PROGRAM_SHARED_IMAGE_BASE}/per-answer-explanation.jpeg`,
  2: `${PROGRAM_SHARED_IMAGE_BASE}/visual-explanations.jpeg`,
};

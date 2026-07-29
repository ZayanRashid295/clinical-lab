export type ExamTrack = "fcps" | "jcat";
export type ExamProduct = "medicine-and-allied";

export interface ProgramStat {
  num: string;
  label: string;
}

export interface ProgramResource {
  title: string;
  desc: string;
}

export interface ExamProductConfig {
  slug: ExamProduct;
  label: string;
  blurb: string;
}

export interface ExamCategoryConfig {
  slug: ExamTrack;
  label: string;
  navLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  landingBlurb: string;
  products: ExamProductConfig[];
}

export interface ProgramConfig {
  slug: ExamTrack;
  badge: string;
  heroSubtitle: string;
  stats: ProgramStat[];
  qbankHeading: string;
  qbankText: string;
  resourcesHeading: string;
  resourcesText: string;
  resources: ProgramResource[];
}

export const MEDICINE_AND_ALLIED: ExamProductConfig = {
  slug: "medicine-and-allied",
  label: "Medicine and Allied",
  blurb:
    "Scenario-based MCQs with every option explained — built for Medicine & Allied candidates.",
};

export const CATEGORIES: Record<ExamTrack, ExamCategoryConfig> = {
  fcps: {
    slug: "fcps",
    label: "FCPS-1",
    navLabel: "FCPS-1",
    heroTitle: "FCPS-1",
    heroSubtitle:
      "Choose a product track built for FCPS-1 preparation — starting with Medicine and Allied.",
    landingBlurb:
      "Turn knowledge into exam performance with comprehensive question banks and deep explanations built for FCPS aspirants.",
    products: [MEDICINE_AND_ALLIED],
  },
  jcat: {
    slug: "jcat",
    label: "MDMS/ JCAT",
    navLabel: "MDMS/ JCAT",
    heroTitle: "MDMS/ JCAT",
    heroSubtitle:
      "Choose a product track built for the MDMS entrance exam — starting with Medicine and Allied.",
    landingBlurb:
      "Entrance exam preparation powered by clinical scenarios, reasoning-based questions, and complete answer breakdowns.",
    products: [MEDICINE_AND_ALLIED],
  },
};

export function categoryPath(category: ExamTrack): string {
  return `/landing-page/${category}`;
}

export function productPath(
  category: ExamTrack,
  product: ExamProduct = "medicine-and-allied",
): string {
  return `/landing-page/${category}/${product}`;
}

export const PROGRAMS: Record<ExamTrack, ProgramConfig> = {
  fcps: {
    slug: "fcps",
    badge: "FCPS-1",
    heroSubtitle:
      "A premium FCPS-1 Qbank with high-yield questions, comprehensive explanations for every option, and performance analytics designed to help you think like a specialist.",
    stats: [
      { num: "3,000+", label: "Questions at Exam-Level Difficulty" },
      { num: "100%", label: "Options Explained for Every MCQ" },
      { num: "Scenario", label: "Based QBank with Full Explanations" },
      { num: "Live", label: "Analytics to Track Your Performance" },
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
    badge: "MDMS/ JCAT",
    heroSubtitle:
      "Master real-world clinical reasoning through challenging cases, detailed explanations of every option, and exam-focused practice for MDMS/ JCAT success.",
    stats: [
      { num: "3,000+", label: "Questions at Exam-Level Difficulty" },
      { num: "100%", label: "Options Explained for Every MCQ" },
      { num: "Scenario", label: "Based QBank with Full Explanations" },
      { num: "Live", label: "Analytics to Track Your Performance" },
    ],
    qbankHeading: "What to Expect from Your MDMS/ JCAT Question Bank",
    qbankText:
      "Our MDMS/ JCAT QBank gives you full control over what you study and how you study it. Build custom tests from 3,000+ practice questions and get comfortable with what you'll face on exam day.",
    resourcesHeading: "MDMS/ JCAT Resources to Boost Your Confidence",
    resourcesText: "Fill in knowledge gaps and sharpen your clinical reasoning as you build toward exam day.",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks that mirror the real MDMS/ JCAT screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, so you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations that make complex clinical concepts easier to retain." },
    ],
  },
};

/** Copy for Medicine and Allied product pages (nav → Medicine and Allied). */
export const MEDICINE_PRODUCT_COPY: Record<
  ExamTrack,
  {
    heroSubtitle: string;
    qbankHeading: string;
    qbankText: string;
    resourcesHeading: string;
    resources: ProgramResource[];
    faqs: Array<{ q: string; a: string }>;
  }
> = {
  fcps: {
    heroSubtitle:
      "Thousands of graduate candidates rely on our platform for focused, high-yield Medicine and Allied preparation. We pair a rigorous question bank with detailed explanations to build lasting clinical knowledge and exam confidence.",
    qbankHeading: "What to Expect from Your Medicine and Allied Question Bank",
    qbankText:
      "Our Medicine and Allied QBank gives you full control over your revision. Build custom tests from 3,000+ practice questions and become familiar with the format you'll face on exam day.",
    resourcesHeading: "Medicine and Allied Resources to Boost Your Confidence",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks mirror the real exam screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, help you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations make complex clinical concepts easier to picture and retain." },
    ],
    faqs: [
      {
        q: "How many practice questions does the Medicine and Allied QBank include?",
        a: "The Medicine and Allied QBank includes 3,000+ questions written at or above real exam difficulty, covering every subject in the syllabus.",
      },
      {
        q: "Are the questions similar to the real exam?",
        a: "Yes. Every scenario, timing block, and option format is built to mirror the structure and difficulty of the real paper.",
      },
      {
        q: "Can I track my performance by subject?",
        a: "Yes. Live analytics break down your accuracy and timing by subject, so you always know exactly where to focus next.",
      },
      {
        q: "Is there a free demo available?",
        a: 'Yes. Use "View sample questions" above to try a short set of Medicine and Allied questions before you create an account.',
      },
    ],
  },
  jcat: {
    heroSubtitle:
      "Purpose-built for Medicine and Allied candidates. Scenario-heavy questions and full answer breakdowns build the clinical reasoning that high-stakes entrance exams test for.",
    qbankHeading: "What to Expect from Your Medicine and Allied Question Bank",
    qbankText:
      "Our Medicine and Allied QBank gives you full control over your revision. Build custom tests from 3,000+ practice questions and become familiar with the format you'll face on exam day.",
    resourcesHeading: "Medicine and Allied Resources to Boost Your Confidence",
    resources: [
      { title: "Realistic Exam-Style Testing Interface", desc: "Timed practice blocks mirror the real exam screen, so nothing feels unfamiliar on test day." },
      { title: "Step-by-Step Reasoning for Every Question", desc: "Full walkthroughs, not just answer keys, help you understand the logic behind every option." },
      { title: "Visual Explanations with Labeled Diagrams", desc: "Charts, tables, and labeled illustrations make complex clinical concepts easier to picture and retain." },
    ],
    faqs: [
      {
        q: "What does the Medicine and Allied QBank cover?",
        a: "It includes 3,000+ scenario-based questions purpose-built for entrance-exam format and difficulty.",
      },
      {
        q: "How is this Medicine and Allied track structured?",
        a: "Questions are weighted toward clinical scenarios and timing pressure typical of high-stakes entrance exams, with every option explained in full.",
      },
      {
        q: "Does the QBank include full-length mock tests?",
        a: "Yes. Alongside custom practice blocks, you can sit full-length timed mocks that mirror real exam format.",
      },
      {
        q: "Is there a free demo available?",
        a: 'Yes. Use "View sample questions" above to try a short set of Medicine and Allied questions before you create an account.',
      },
    ],
  },
};

export const PROGRAM_FAQS: Record<ExamTrack, Array<{ q: string; a: string }>> = {
  fcps: [
    {
      q: "How many practice questions does the FCPS-1 QBank include?",
      a: "The FCPS-1 QBank includes 3,000+ questions written at or above real exam difficulty, covering every subject in the syllabus.",
    },
    {
      q: "Are the questions similar to the real FCPS-1 exam?",
      a: "Yes. Every scenario, timing block, and option format is built to mirror the structure and difficulty of the real FCPS-1 paper.",
    },
    {
      q: "Can I track my performance by subject?",
      a: "Yes. Live analytics break down your accuracy and timing by subject, so you always know where to focus next.",
    },
    {
      q: "Is there a free demo available?",
      a: 'Yes. Use "View sample questions" above to try a short set of FCPS-1 questions before you create an account.',
    },
  ],
  jcat: [
    {
      q: "What does the MDMS/ JCAT QBank cover?",
      a: "It includes 3,000+ scenario-based questions purpose-built for the MDMS entrance exam's format and difficulty level.",
    },
    {
      q: "How is MDMS/ JCAT prep different from FCPS-1 prep?",
      a: "Both share the same explanation-first approach, but MDMS/ JCAT questions are weighted toward the entrance-exam syllabus and scenario format, while FCPS-1 questions target postgraduate-level clinical reasoning.",
    },
    {
      q: "Does the QBank include full-length mock tests?",
      a: "Yes. Alongside custom practice blocks, you can sit full-length timed mocks that mirror the real MDMS/ JCAT exam format.",
    },
    {
      q: "Is there a free demo available?",
      a: 'Yes. Use "View sample questions" above to try a short set of MDMS/ JCAT questions before you create an account.',
    },
  ],
};

export const PROGRAM_TESTIMONIALS: Record<ExamTrack, Array<{ name: string; city: string; text: string }>> = {
  fcps: [
    { name: "Ayesha Raza", city: "Lahore", text: "Explanations are so clear I stopped needing separate reference books. My score jumped a full grade." },
    { name: "Hamza Sheikh", city: "Karachi", text: "Scenario-based MCQs feel exactly like the real paper. Best Medicine and Allied prep I've used." },
    { name: "Sana Malik", city: "Islamabad", text: "The performance tracker showed exactly which subjects I was weak in. Huge time saver." },
    { name: "Usman Tariq", city: "Faisalabad", text: "The exam-like interface removed all the surprises on test day. I knew exactly what to expect." },
    { name: "Fatima Noor", city: "Multan", text: "Every wrong option gets explained too, not just the right one. That's what finally made concepts stick." },
    { name: "Bilal Hussain", city: "Peshawar", text: "I compared three QBanks before choosing this one. The explanations here are genuinely more thorough." },
    { name: "Mehak Aslam", city: "Rawalpindi", text: "Went from failing mocks to a comfortable pass. The subject-wise breakdown made my last month count." },
    { name: "Danish Iqbal", city: "Sialkot", text: "Clinical scenarios read like real cases, not textbook trivia. That made the material easier to remember." },
    { name: "Kiran Yousaf", city: "Hyderabad", text: "Simple, focused, and exam-accurate. Exactly what I needed during a short dedicated study period." },
  ],
  jcat: [
    { name: "Zainab Qureshi", city: "Lahore", text: "The scenario-heavy format matched the exam perfectly. Felt fully prepared walking in." },
    { name: "Ali Hassan", city: "Rawalpindi", text: "Subject-wise breakdown helped me focus my last two weeks on exactly the right topics." },
    { name: "Mahnoor Iqbal", city: "Karachi", text: "Clear visuals in the explanations made tough concepts click much faster." },
    { name: "Saad Malik", city: "Multan", text: "The mock tests replicated the real block timing almost exactly. No surprises on exam day." },
    { name: "Hira Shahid", city: "Faisalabad", text: "I liked that every option was explained — it forced me to actually understand, not memorize." },
    { name: "Tayyab Riaz", city: "Peshawar", text: "Went through the whole QBank twice. My accuracy on weak subjects improved a lot by the second pass." },
    { name: "Areeba Nadeem", city: "Islamabad", text: "The interface is close enough to the real exam screen that test day felt familiar." },
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

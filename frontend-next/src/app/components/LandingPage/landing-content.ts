export const LANDING_STATS = [
  { value: "20+", label: "Clinical cases" },
  { value: "5", label: "Learning modes" },
  { value: "24/7", label: "AI practice" },
  { value: "OSCE", label: "Rubric feedback" },
] as const;

export const LEARNING_MODES = [
  {
    id: "shadow",
    badge: "Observe",
    title: "Shadow Mode",
    description:
      "Watch AI faculty conduct encounters, pause anytime, and ask why each decision was made.",
    image: "/images/Faculty_reviewing_student_analytics_dashboard_94a01cbe.png",
    highlights: ["Teachable moments", "Expert reasoning", "Interactive Q&A"],
  },
  {
    id: "learning",
    badge: "Guided",
    title: "Learning Mode",
    description:
      "Structured cases with objectives, hints, and step-by-step coaching through history, exam, and workup.",
    image: "/images/Medical_students_AI_learning_collaboration_6db2826f.png",
    highlights: ["Case objectives", "Guided workup", "Competency alignment"],
  },
  {
    id: "practice",
    badge: "Perform",
    title: "Practice & OSCE",
    description:
      "Lead the encounter yourself—interview, examine, investigate, diagnose, and submit SOAP notes for scoring.",
    image: "/images/Student_practicing_virtual_patient_interview_225e435d.png",
    highlights: ["Full encounters", "SOAP grading", "Performance analytics"],
  },
] as const;

export const AUDIENCE_BLOCKS = [
  {
    title: "For medical students",
    description:
      "Build confidence before clerkships with unlimited AI patients, instant feedback, and progress tracking.",
    bullets: [
      "Assignments from your institution",
      "Faculty messaging & coaching",
      "Achievements, streaks, and leaderboards",
      "QBank, mock exams, and study tools",
    ],
    cta: "Start as a student",
    image: "/images/Student_practicing_virtual_patient_interview_225e435d.png",
  },
  {
    title: "For institutions",
    description:
      "Deploy scalable clinical training with faculty dashboards, cohort analytics, and custom cases.",
    bullets: [
      "Faculty workspace & student compare",
      "Publish assignments & institution cases",
      "Domain-based student linking",
      "Usage and competency reporting",
    ],
    cta: "Talk to us",
    image: "/images/Faculty_reviewing_student_analytics_dashboard_94a01cbe.png",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Shadow mode finally let me see how an attending thinks through a case—not just the right answer.",
    name: "Medical student",
    role: "Year 3, Internal Medicine",
  },
  {
    quote:
      "We assigned COPD and cardiology cases across the cohort and tracked completion in one dashboard.",
    name: "Course director",
    role: "MedPrep Clinical College",
  },
  {
    quote:
      "SOAP note grading aligned with our OSCE rubric. Students knew exactly what to improve.",
    name: "Clerkship coordinator",
    role: "Teaching hospital",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "What is MedPrepAI?",
    a: "MedPrepAI is an AI-powered clinical education platform for medical students and institutions. Practice interviews, shadow expert reasoning, complete assignments, and receive OSCE-style feedback.",
  },
  {
    q: "Do I need an institution email?",
    a: "Students can sign up individually. If your school uses MedPrepAI, sign in with your institution email to unlock faculty assignments, cases, and messaging.",
  },
  {
    q: "Is there a free trial?",
    a: "Most plans include a trial period. Choose a package below to see current pricing and trial terms configured by your administrator.",
  },
  {
    q: "What learning modes are included?",
    a: "Shadow, Learning, Practice, Let Me Drive, Support, and Evaluation modes—plus institution-specific cases and faculty oversight where enabled.",
  },
  {
    q: "Can faculty create custom cases?",
    a: "Yes. Institution faculty can author cases, publish assignments, message students, and review analytics from the faculty workspace.",
  },
] as const;

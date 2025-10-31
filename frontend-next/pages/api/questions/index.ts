import type { NextApiRequest, NextApiResponse } from "next";

// Mock questions matching uworld-replit schema
const mockQuestions = [
  {
    id: "q1",
    text: "A 65-year-old male presents with chest pain that radiates to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
    options: ["Anterior wall MI", "Inferior wall MI", "Lateral wall MI", "Posterior wall MI"],
    correctAnswer: "Inferior wall MI",
    explanation: "The patient presents with classic symptoms of inferior wall myocardial infarction. ST elevation in leads II, III, and aVF indicates inferior wall involvement.",
    subject: "Cardiology",
    system: "cardio",
    difficulty: "Medium" as const,
  },
  {
    id: "q2",
    text: "Which of the following is the most common cause of acute kidney injury in hospitalized patients?",
    options: ["Prerenal azotemia", "Acute tubular necrosis", "Glomerulonephritis", "Urinary obstruction"],
    correctAnswer: "Prerenal azotemia",
    explanation: "Prerenal causes, particularly hypovolemia and decreased effective circulating volume, account for 60-70% of acute kidney injury cases in hospitalized patients.",
    subject: "Nephrology",
    system: "renal",
    difficulty: "Medium" as const,
  },
  {
    id: "q3",
    text: "A patient presents with megaloblastic anemia. Which of the following is the most likely cause?",
    options: ["Iron deficiency", "Pernicious anemia", "Chronic disease", "Hemolysis"],
    correctAnswer: "Pernicious anemia",
    explanation: "Megaloblastic anemia is characterized by large, immature red blood cells and is most commonly caused by vitamin B12 deficiency (pernicious anemia) or folate deficiency.",
    subject: "Hematology",
    system: "heme-onc",
    difficulty: "Easy" as const,
  },
  {
    id: "q4",
    text: "Which structure divides during development to form the ascending aorta and pulmonary trunk?",
    options: ["Truncus arteriosus", "Bulbus cordis", "Primitive atrium", "Sinus venosus"],
    correctAnswer: "Truncus arteriosus",
    explanation: "The truncus arteriosus divides to form the ascending aorta and pulmonary trunk.",
    subject: "Embryology",
    system: "cardio",
    difficulty: "Hard" as const,
  },
  {
    id: "q5",
    text: "What is the inheritance pattern of sickle cell disease?",
    options: ["Autosomal recessive", "Autosomal dominant", "X-linked recessive", "X-linked dominant"],
    correctAnswer: "Autosomal recessive",
    explanation: "Sickle cell disease follows an autosomal recessive inheritance pattern.",
    subject: "Genetics",
    system: "heme-onc",
    difficulty: "Easy" as const,
  },
  {
    id: "q6",
    text: "Which type of collagen is most abundant in bone?",
    options: ["Type I", "Type II", "Type III", "Type IV"],
    correctAnswer: "Type I",
    explanation: "Type I collagen is the most abundant collagen in bone, providing tensile strength.",
    subject: "Histology",
    system: "rheum",
    difficulty: "Easy" as const,
  },
  {
    id: "q7",
    text: "A patient with chronic kidney disease presents with fatigue and pallor. What is the most likely cause of anemia?",
    options: ["Decreased erythropoietin production", "Iron deficiency", "Vitamin B12 deficiency", "Hemolysis"],
    correctAnswer: "Decreased erythropoietin production",
    explanation: "Chronic kidney disease leads to decreased erythropoietin production, causing anemia.",
    subject: "Pathophysiology",
    system: "renal",
    difficulty: "Medium" as const,
  },
  {
    id: "q8",
    text: "Which structure controls the release of hormones from the pituitary gland?",
    options: ["Hypothalamus", "Thalamus", "Pineal gland", "Adrenal cortex"],
    correctAnswer: "Hypothalamus",
    explanation: "The hypothalamus regulates pituitary hormone secretion through releasing and inhibiting hormones.",
    subject: "Physiology",
    system: "endo",
    difficulty: "Easy" as const,
  },
  {
    id: "q9",
    text: "A patient presents with a painless ulcer on the genitals. Darkfield microscopy reveals spirochetes. What is the most likely diagnosis?",
    options: ["Primary syphilis", "Herpes simplex", "Chancroid", "Lymphogranuloma venereum"],
    correctAnswer: "Primary syphilis",
    explanation: "Painless genital ulcer (chancre) with spirochetes visible on darkfield microscopy is diagnostic of primary syphilis.",
    subject: "Microbiology",
    system: "infectious",
    difficulty: "Medium" as const,
  },
  {
    id: "q10",
    text: "A 55-year-old woman presents with a pruritic rash on her wrists and ankles. Physical exam shows flat-topped, polygonal, purple papules. What is the diagnosis?",
    options: ["Lichen planus", "Psoriasis", "Eczema", "Pityriasis rosea"],
    correctAnswer: "Lichen planus",
    explanation: "The 6 Ps of lichen planus: Pruritic, Purple, Polygonal, Planar (flat-topped) Papules and Plaques.",
    subject: "Pathology",
    system: "derm",
    difficulty: "Medium" as const,
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    try {
      const { subject, system, searchTerm } = req.query;

      let filteredQuestions = [...mockQuestions];

      // Filter by subject
      if (subject && typeof subject === "string" && subject !== "all") {
        filteredQuestions = filteredQuestions.filter((q) => q.subject === subject);
      }

      // Filter by system
      if (system && typeof system === "string" && system !== "all") {
        filteredQuestions = filteredQuestions.filter((q) => q.system === system);
      }

      // Filter by search term
      if (searchTerm && typeof searchTerm === "string") {
        const term = searchTerm.toLowerCase();
        filteredQuestions = filteredQuestions.filter(
          (q) =>
            q.text.toLowerCase().includes(term) ||
            q.subject.toLowerCase().includes(term) ||
            q.system.toLowerCase().includes(term)
        );
      }

      return res.status(200).json(filteredQuestions);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Failed to fetch questions" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}


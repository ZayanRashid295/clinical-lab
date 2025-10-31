import type { NextApiRequest, NextApiResponse } from "next";

// In-memory storage for tests (replace with database in production)
// Use global to share across API routes in development
declare global {
  // eslint-disable-next-line no-var
  var testStorage: Map<string, any> | undefined;
}

const testStorage = global.testStorage || new Map<string, any>();
if (process.env.NODE_ENV !== "production") {
  global.testStorage = testStorage;
}

// Subject to system mapping
const subjectToSystem: Record<string, string> = {
  Cardiology: "cardio",
  Nephrology: "renal",
  Hematology: "heme-onc",
  Embryology: "cardio",
  Genetics: "heme-onc",
  Histology: "rheum",
  Pathophysiology: "renal",
  Physiology: "endo",
  Microbiology: "infectious",
  Pathology: "derm",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set JSON content type
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      mode,
      isTimed,
      questionPool,
      subjects,
      systems,
      questionCount,
      duration,
    } = req.body;

    // Validation
    if (!name || !mode || !subjects || !systems || !questionCount) {
      return res.status(400).json({ 
        error: "Missing required fields: name, mode, subjects, systems, questionCount" 
      });
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "At least one subject is required" });
    }

    if (!Array.isArray(systems) || systems.length === 0) {
      return res.status(400).json({ error: "At least one system is required" });
    }

    if (typeof questionCount !== "number" || questionCount <= 0 || questionCount > 40) {
      return res.status(400).json({ 
        error: "Question count must be between 1 and 40" 
      });
    }

    // Import questions data directly
    // In production, this would come from a database/service
    const allQuestions = [
      {
        id: "q1",
        text: "A 65-year-old male presents with chest pain that radiates to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
        options: ["Anterior wall MI", "Inferior wall MI", "Lateral wall MI", "Posterior wall MI"],
        correctAnswer: "Inferior wall MI",
        explanation: "The patient presents with classic symptoms of inferior wall myocardial infarction. ST elevation in leads II, III, and aVF indicates inferior wall involvement.",
        subject: "Cardiology",
        system: "cardio",
        difficulty: "Medium",
      },
      {
        id: "q2",
        text: "Which of the following is the most common cause of acute kidney injury in hospitalized patients?",
        options: ["Prerenal azotemia", "Acute tubular necrosis", "Glomerulonephritis", "Urinary obstruction"],
        correctAnswer: "Prerenal azotemia",
        explanation: "Prerenal causes, particularly hypovolemia and decreased effective circulating volume, account for 60-70% of acute kidney injury cases in hospitalized patients.",
        subject: "Nephrology",
        system: "renal",
        difficulty: "Medium",
      },
      {
        id: "q3",
        text: "A patient presents with megaloblastic anemia. Which of the following is the most likely cause?",
        options: ["Iron deficiency", "Pernicious anemia", "Chronic disease", "Hemolysis"],
        correctAnswer: "Pernicious anemia",
        explanation: "Megaloblastic anemia is characterized by large, immature red blood cells and is most commonly caused by vitamin B12 deficiency (pernicious anemia) or folate deficiency.",
        subject: "Hematology",
        system: "heme-onc",
        difficulty: "Easy",
      },
      {
        id: "q4",
        text: "Which structure divides during development to form the ascending aorta and pulmonary trunk?",
        options: ["Truncus arteriosus", "Bulbus cordis", "Primitive atrium", "Sinus venosus"],
        correctAnswer: "Truncus arteriosus",
        explanation: "The truncus arteriosus divides to form the ascending aorta and pulmonary trunk.",
        subject: "Embryology",
        system: "cardio",
        difficulty: "Hard",
      },
      {
        id: "q5",
        text: "What is the inheritance pattern of sickle cell disease?",
        options: ["Autosomal recessive", "Autosomal dominant", "X-linked recessive", "X-linked dominant"],
        correctAnswer: "Autosomal recessive",
        explanation: "Sickle cell disease follows an autosomal recessive inheritance pattern.",
        subject: "Genetics",
        system: "heme-onc",
        difficulty: "Easy",
      },
      {
        id: "q6",
        text: "Which type of collagen is most abundant in bone?",
        options: ["Type I", "Type II", "Type III", "Type IV"],
        correctAnswer: "Type I",
        explanation: "Type I collagen is the most abundant collagen in bone, providing tensile strength.",
        subject: "Histology",
        system: "rheum",
        difficulty: "Easy",
      },
      {
        id: "q7",
        text: "A patient with chronic kidney disease presents with fatigue and pallor. What is the most likely cause of anemia?",
        options: ["Decreased erythropoietin production", "Iron deficiency", "Vitamin B12 deficiency", "Hemolysis"],
        correctAnswer: "Decreased erythropoietin production",
        explanation: "Chronic kidney disease leads to decreased erythropoietin production, causing anemia.",
        subject: "Pathophysiology",
        system: "renal",
        difficulty: "Medium",
      },
      {
        id: "q8",
        text: "Which structure controls the release of hormones from the pituitary gland?",
        options: ["Hypothalamus", "Thalamus", "Pineal gland", "Adrenal cortex"],
        correctAnswer: "Hypothalamus",
        explanation: "The hypothalamus regulates pituitary hormone secretion through releasing and inhibiting hormones.",
        subject: "Physiology",
        system: "endo",
        difficulty: "Easy",
      },
      {
        id: "q9",
        text: "A patient presents with a painless ulcer on the genitals. Darkfield microscopy reveals spirochetes. What is the most likely diagnosis?",
        options: ["Primary syphilis", "Herpes simplex", "Chancroid", "Lymphogranuloma venereum"],
        correctAnswer: "Primary syphilis",
        explanation: "Painless genital ulcer (chancre) with spirochetes visible on darkfield microscopy is diagnostic of primary syphilis.",
        subject: "Microbiology",
        system: "infectious",
        difficulty: "Medium",
      },
      {
        id: "q10",
        text: "A 55-year-old woman presents with a pruritic rash on her wrists and ankles. Physical exam shows flat-topped, polygonal, purple papules. What is the diagnosis?",
        options: ["Lichen planus", "Psoriasis", "Eczema", "Pityriasis rosea"],
        correctAnswer: "Lichen planus",
        explanation: "The 6 Ps of lichen planus: Pruritic, Purple, Polygonal, Planar (flat-topped) Papules and Plaques.",
        subject: "Pathology",
        system: "derm",
        difficulty: "Medium",
      },
    ];

    // Filter questions by subjects OR systems (like uworld-replit)
    let filteredQuestions = allQuestions.filter((q: any) => {
      const matchesSubject = subjects.length === 0 || subjects.includes(q.subject);
      const matchesSystem = systems.length === 0 || systems.includes(q.system);
      // Question matches if it matches ANY selected subject OR ANY selected system
      return matchesSubject || matchesSystem;
    });

    // Check if we have enough questions
    if (filteredQuestions.length === 0) {
      return res.status(400).json({
        error: "No questions found matching the selected subjects or systems. Please adjust your filters.",
      });
    }

    if (filteredQuestions.length < questionCount) {
      return res.status(400).json({
        error: `Only ${filteredQuestions.length} question(s) available for the selected filters. Please reduce the question count or adjust your filters.`,
      });
    }

    // Shuffle and select questions
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, questionCount);
    const questionIds = selectedQuestions.map((q: any) => q.id);

    // Generate test ID (simple UUID-like string)
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create test object
    const test = {
      id: testId,
      name,
      mode,
      isTimed: isTimed || false,
      questionPool: questionPool || "unused",
      subjects,
      systems,
      questionCount,
      duration: duration || (isTimed ? questionCount * 1.5 : undefined),
      questions: questionIds,
      answers: {},
      markedQuestions: [],
      status: "in-progress",
      createdAt: new Date().toISOString(),
    };

    // Store test in memory
    testStorage.set(testId, test);

    return res.status(201).json(test);
  } catch (error: any) {
    console.error("Error creating test:", error);
    return res.status(500).json({ 
      error: error?.message || "Failed to create test" 
    });
  }
}


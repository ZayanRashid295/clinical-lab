import type { NextApiRequest, NextApiResponse } from "next";

// Mock questions matching uworld-replit schema
const mockQuestions: Record<string, any> = {
  q1: {
    id: "q1",
    text: "A 65-year-old male presents with chest pain that radiates to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
    options: ["Anterior wall MI", "Inferior wall MI", "Lateral wall MI", "Posterior wall MI"],
    correctAnswer: "Inferior wall MI",
    explanation: "The patient presents with classic symptoms of inferior wall myocardial infarction. ST elevation in leads II, III, and aVF indicates inferior wall involvement.",
    subject: "Cardiology",
    system: "cardio",
    difficulty: "Medium",
  },
  q2: {
    id: "q2",
    text: "Which of the following is the most common cause of acute kidney injury in hospitalized patients?",
    options: ["Prerenal azotemia", "Acute tubular necrosis", "Glomerulonephritis", "Urinary obstruction"],
    correctAnswer: "Prerenal azotemia",
    explanation: "Prerenal causes, particularly hypovolemia and decreased effective circulating volume, account for 60-70% of acute kidney injury cases in hospitalized patients.",
    subject: "Nephrology",
    system: "renal",
    difficulty: "Medium",
  },
  q3: {
    id: "q3",
    text: "A patient presents with megaloblastic anemia. Which of the following is the most likely cause?",
    options: ["Iron deficiency", "Pernicious anemia", "Chronic disease", "Hemolysis"],
    correctAnswer: "Pernicious anemia",
    explanation: "Megaloblastic anemia is characterized by large, immature red blood cells and is most commonly caused by vitamin B12 deficiency (pernicious anemia) or folate deficiency.",
    subject: "Hematology",
    system: "heme-onc",
    difficulty: "Easy",
  },
  q4: {
    id: "q4",
    text: "Which structure divides during development to form the ascending aorta and pulmonary trunk?",
    options: ["Truncus arteriosus", "Bulbus cordis", "Primitive atrium", "Sinus venosus"],
    correctAnswer: "Truncus arteriosus",
    explanation: "The truncus arteriosus divides to form the ascending aorta and pulmonary trunk.",
    subject: "Embryology",
    system: "cardio",
    difficulty: "Hard",
  },
  q5: {
    id: "q5",
    text: "What is the inheritance pattern of sickle cell disease?",
    options: ["Autosomal recessive", "Autosomal dominant", "X-linked recessive", "X-linked dominant"],
    correctAnswer: "Autosomal recessive",
    explanation: "Sickle cell disease follows an autosomal recessive inheritance pattern.",
    subject: "Genetics",
    system: "heme-onc",
    difficulty: "Easy",
  },
  q6: {
    id: "q6",
    text: "Which type of collagen is most abundant in bone?",
    options: ["Type I", "Type II", "Type III", "Type IV"],
    correctAnswer: "Type I",
    explanation: "Type I collagen is the most abundant collagen in bone, providing tensile strength.",
    subject: "Histology",
    system: "rheum",
    difficulty: "Easy",
  },
  q7: {
    id: "q7",
    text: "A patient with chronic kidney disease presents with fatigue and pallor. What is the most likely cause of anemia?",
    options: ["Decreased erythropoietin production", "Iron deficiency", "Vitamin B12 deficiency", "Hemolysis"],
    correctAnswer: "Decreased erythropoietin production",
    explanation: "Chronic kidney disease leads to decreased erythropoietin production, causing anemia.",
    subject: "Pathophysiology",
    system: "renal",
    difficulty: "Medium",
  },
  q8: {
    id: "q8",
    text: "Which structure controls the release of hormones from the pituitary gland?",
    options: ["Hypothalamus", "Thalamus", "Pineal gland", "Adrenal cortex"],
    correctAnswer: "Hypothalamus",
    explanation: "The hypothalamus regulates pituitary hormone secretion through releasing and inhibiting hormones.",
    subject: "Physiology",
    system: "endo",
    difficulty: "Easy",
  },
  q9: {
    id: "q9",
    text: "A patient presents with a painless ulcer on the genitals. Darkfield microscopy reveals spirochetes. What is the most likely diagnosis?",
    options: ["Primary syphilis", "Herpes simplex", "Chancroid", "Lymphogranuloma venereum"],
    correctAnswer: "Primary syphilis",
    explanation: "Painless genital ulcer (chancre) with spirochetes visible on darkfield microscopy is diagnostic of primary syphilis.",
    subject: "Microbiology",
    system: "infectious",
    difficulty: "Medium",
  },
  q10: {
    id: "q10",
    text: "A 55-year-old woman presents with a pruritic rash on her wrists and ankles. Physical exam shows flat-topped, polygonal, purple papules. What is the diagnosis?",
    options: ["Lichen planus", "Psoriasis", "Eczema", "Pityriasis rosea"],
    correctAnswer: "Lichen planus",
    explanation: "The 6 Ps of lichen planus: Pruritic, Purple, Polygonal, Planar (flat-topped) Papules and Plaques.",
    subject: "Pathology",
    system: "derm",
    difficulty: "Medium",
  },
  q11: {
    id: "q11",
    text: "What is the treatment of choice for acetaminophen overdose?",
    options: ["N-acetylcysteine", "Naloxone", "Flumazenil", "Activated charcoal alone"],
    correctAnswer: "N-acetylcysteine",
    explanation: "N-acetylcysteine is the antidote for acetaminophen overdose, providing glutathione precursors.",
    subject: "Pharmacology",
    system: "poisoning",
    difficulty: "Easy",
  },
  q12: {
    id: "q12",
    text: "Which enzyme is responsible for the rate-limiting step in glycolysis?",
    options: ["Hexokinase", "Phosphofructokinase", "Pyruvate kinase", "Aldolase"],
    correctAnswer: "Phosphofructokinase",
    explanation: "Phosphofructokinase (PFK-1) is the rate-limiting enzyme in glycolysis, converting fructose-6-phosphate to fructose-1,6-bisphosphate.",
    subject: "Biochemistry",
    system: "biostats",
    difficulty: "Medium",
  },
  q13: {
    id: "q13",
    text: "What is the primary metabolic pathway for glucose in the liver?",
    options: ["Glycolysis", "Gluconeogenesis", "Glycogen synthesis", "Pentose phosphate pathway"],
    correctAnswer: "Glycolysis",
    explanation: "Glycolysis is the primary metabolic pathway for glucose breakdown in the liver, producing pyruvate and ATP.",
    subject: "Biochemistry",
    system: "endo",
    difficulty: "Easy",
  },
  q14: {
    id: "q14",
    text: "A patient presents after ingesting a large amount of warfarin. What is the antidote?",
    options: ["Vitamin K", "Protamine sulfate", "N-acetylcysteine", "Atropine"],
    correctAnswer: "Vitamin K",
    explanation: "Vitamin K is the antidote for warfarin overdose, as warfarin inhibits vitamin K-dependent clotting factors.",
    subject: "Pharmacology",
    system: "poisoning",
    difficulty: "Easy",
  },
  q15: {
    id: "q15",
    text: "Which of the following is a characteristic feature of Kreb's cycle?",
    options: ["Produces 2 ATP per cycle", "Occurs in the mitochondria", "Requires oxygen", "All of the above"],
    correctAnswer: "All of the above",
    explanation: "The Kreb's cycle produces 2 ATP per cycle, occurs in the mitochondrial matrix, and requires oxygen as the final electron acceptor.",
    subject: "Biochemistry",
    system: "biostats",
    difficulty: "Medium",
  },
  q16: {
    id: "q16",
    text: "A 30-year-old presents with altered mental status after ingestion of an unknown substance. Physical exam shows miosis, bradycardia, and respiratory depression. What is the most likely cause?",
    options: ["Opioid overdose", "Stimulant overdose", "Anticholinergic poisoning", "Salicylate poisoning"],
    correctAnswer: "Opioid overdose",
    explanation: "The triad of miosis, bradycardia, and respiratory depression is classic for opioid overdose. Naloxone is the treatment.",
    subject: "Emergency Medicine",
    system: "poisoning",
    difficulty: "Medium",
  },
  q17: {
    id: "q17",
    text: "Which coenzyme is required for pyruvate dehydrogenase complex?",
    options: ["NAD+", "FAD", "Thiamine pyrophosphate", "Coenzyme A"],
    correctAnswer: "Thiamine pyrophosphate",
    explanation: "Pyruvate dehydrogenase complex requires multiple coenzymes including thiamine pyrophosphate (TPP), which is essential for the decarboxylation step.",
    subject: "Biochemistry",
    system: "biostats",
    difficulty: "Hard",
  },
  q18: {
    id: "q18",
    text: "What is the antidote for organophosphate poisoning?",
    options: ["Atropine and pralidoxime", "N-acetylcysteine", "Physostigmine", "Edrophonium"],
    correctAnswer: "Atropine and pralidoxime",
    explanation: "Organophosphate poisoning causes acetylcholine accumulation. Atropine blocks muscarinic receptors, and pralidoxime reactivates acetylcholinesterase.",
    subject: "Emergency Medicine",
    system: "poisoning",
    difficulty: "Medium",
  },
  q19: {
    id: "q19",
    text: "In the electron transport chain, which complex pumps protons across the inner mitochondrial membrane?",
    options: ["Complex I only", "Complexes I, III, and IV", "Complex II only", "Complex V"],
    correctAnswer: "Complexes I, III, and IV",
    explanation: "Complexes I, III, and IV pump protons across the inner mitochondrial membrane, creating the proton gradient used by ATP synthase.",
    subject: "Biochemistry",
    system: "biostats",
    difficulty: "Hard",
  },
  q20: {
    id: "q20",
    text: "A patient presents with severe salicylate poisoning. What is the appropriate treatment?",
    options: ["Alkalinization of urine with bicarbonate", "Acidification of urine", "Hemodialysis only", "Supportive care only"],
    correctAnswer: "Alkalinization of urine with bicarbonate",
    explanation: "Alkalinization of urine with sodium bicarbonate promotes salicylate excretion by ion trapping in the urine.",
    subject: "Emergency Medicine",
    system: "poisoning",
    difficulty: "Medium",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Question ID is required" });
    }

    const question = mockQuestions[id];

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.status(200).json(question);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to fetch question" });
  }
}


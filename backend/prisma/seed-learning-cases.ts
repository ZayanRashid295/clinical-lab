import { PrismaClient } from "@prisma/client";

export const sampleLearningCases = [
  {
    title: "Chest Pain in a 45-year-old Male",
    description:
      "A 45-year-old construction worker presents with acute chest pain that started 2 hours ago while at work.",
    difficulty: "intermediate",
    disease: "Myocardial Infarction",
    diseaseName: "Acute ST-Elevation Myocardial Infarction (STEMI)",
    specialty: "Cardiology",
    isRare: false,
    symptoms: [
      "Severe chest pain",
      "Pain radiating to left arm",
      "Shortness of breath",
      "Nausea and vomiting",
      "Diaphoresis (excessive sweating)",
    ],
    history: [
      "Hypertension for 5 years",
      "Smoking 1 pack per day for 20 years",
      "Family history of heart disease",
      "No known allergies",
    ],
    labs: {
      "Troponin I": "Elevated (>0.04 ng/mL)",
      "CK-MB": "Elevated",
      "Total Cholesterol": "280 mg/dL",
      LDL: "180 mg/dL",
      HDL: "35 mg/dL",
    },
    expectedQuestions: [
      "Can you describe the chest pain?",
      "When did the pain start?",
      "Does the pain radiate anywhere?",
      "Have you had similar episodes before?",
      "Are you taking any medications?",
      "Do you have any allergies?",
      "What were you doing when the pain started?",
      "Have you noticed any shortness of breath?",
    ],
    patientProfile: {
      name: "John Smith",
      age: 45,
      gender: "Male",
      occupation: "Construction Worker",
    },
    vitalSigns: {
      bloodPressure: "160/95 mmHg",
      heartRate: 95,
      temperature: "98.6°F",
      respiratoryRate: 22,
      oxygenSaturation: 94,
    },
    physicalExam: {
      general: "Anxious, diaphoretic male in moderate distress",
      cardiovascular: "Regular rate and rhythm, no murmurs, S4 gallop present",
      respiratory: "Clear to auscultation bilaterally, no wheezing",
      abdominal: "Soft, non-tender, non-distended",
      neurological: "Alert and oriented x3, no focal deficits",
    },
  },
  {
    title: "Headache and Visual Changes in a 28-year-old Female",
    description:
      "A 28-year-old office worker presents with severe headache and visual disturbances for the past 3 days.",
    difficulty: "beginner",
    disease: "Migraine",
    diseaseName: "Migraine with Aura",
    specialty: "Neurology",
    isRare: false,
    symptoms: [
      "Severe throbbing headache",
      "Visual disturbances (flashing lights)",
      "Nausea",
      "Photophobia (sensitivity to light)",
      "Phonophobia (sensitivity to sound)",
    ],
    history: [
      "Similar headaches since age 16",
      "Menstrual cycle triggers",
      "Stress triggers",
      "No significant medical history",
    ],
    labs: {
      "Complete Blood Count": "Normal",
      "Basic Metabolic Panel": "Normal",
      ESR: "Normal",
      CRP: "Normal",
    },
    expectedQuestions: [
      "Can you describe the headache?",
      "When did it start?",
      "Have you had similar headaches before?",
      "Do you notice any triggers?",
      "Are you taking any medications?",
      "Have you noticed any visual changes?",
      "Does light or sound bother you?",
      "How has this affected your daily activities?",
    ],
    patientProfile: {
      name: "Sarah Johnson",
      age: 28,
      gender: "Female",
      occupation: "Office Worker",
    },
    vitalSigns: {
      bloodPressure: "120/80 mmHg",
      heartRate: 72,
      temperature: "98.4°F",
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
    physicalExam: {
      general: "Well-appearing female in mild distress",
      cardiovascular: "Regular rate and rhythm, no murmurs",
      respiratory: "Clear to auscultation bilaterally",
      abdominal: "Soft, non-tender, non-distended",
      neurological:
        "Alert and oriented x3, cranial nerves intact, no focal deficits",
    },
  },
  {
    title: "Abdominal Pain and Jaundice in a 55-year-old Male",
    description:
      "A 55-year-old businessman presents with right upper quadrant pain and yellowing of the skin for 1 week.",
    difficulty: "advanced",
    disease: "Pancreatic Cancer",
    diseaseName: "Pancreatic Adenocarcinoma with Biliary Obstruction",
    specialty: "Gastroenterology",
    isRare: false,
    symptoms: [
      "Right upper quadrant pain",
      "Jaundice (yellowing of skin and eyes)",
      "Dark urine",
      "Pale stools",
      "Weight loss (15 lbs in 2 months)",
      "Loss of appetite",
    ],
    history: [
      "Type 2 diabetes mellitus",
      "Chronic pancreatitis",
      "Heavy alcohol use (now abstinent)",
      "Smoking history (quit 2 years ago)",
    ],
    labs: {
      "Total Bilirubin": "8.5 mg/dL (elevated)",
      "Direct Bilirubin": "6.2 mg/dL (elevated)",
      ALT: "180 U/L (elevated)",
      AST: "220 U/L (elevated)",
      "Alkaline Phosphatase": "450 U/L (elevated)",
      "CA 19-9": "850 U/mL (markedly elevated)",
    },
    expectedQuestions: [
      "Can you describe the abdominal pain?",
      "When did you first notice the yellowing?",
      "Have you lost any weight recently?",
      "How is your appetite?",
      "What color are your stools?",
      "What color is your urine?",
      "Do you have any medical conditions?",
      "Are you taking any medications?",
      "Do you drink alcohol or smoke?",
    ],
    patientProfile: {
      name: "Robert Chen",
      age: 55,
      gender: "Male",
      occupation: "Business Executive",
    },
    vitalSigns: {
      bloodPressure: "140/85 mmHg",
      heartRate: 88,
      temperature: "99.1°F",
      respiratoryRate: 18,
      oxygenSaturation: 96,
    },
    physicalExam: {
      general: "Thin, jaundiced male appearing older than stated age",
      cardiovascular: "Regular rate and rhythm, no murmurs",
      respiratory: "Clear to auscultation bilaterally",
      abdominal:
        "Right upper quadrant tenderness, palpable liver edge, no masses",
      neurological: "Alert and oriented x3, no focal deficits",
    },
  },
];

export async function seedLearningCases(prisma: PrismaClient) {
  console.log("Seeding learning cases...");

  for (const caseData of sampleLearningCases) {
    try {
      await prisma.learningCase.create({
        data: {
          ...caseData,
          symptoms: JSON.stringify(caseData.symptoms),
          history: JSON.stringify(caseData.history),
          labs: JSON.stringify(caseData.labs),
          expectedQuestions: JSON.stringify(caseData.expectedQuestions),
          patientProfile: JSON.stringify(caseData.patientProfile),
          vitalSigns: JSON.stringify(caseData.vitalSigns),
          physicalExam: JSON.stringify(caseData.physicalExam),
        },
      });
      console.log(`Created learning case: ${caseData.title}`);
    } catch (error) {
      console.error(`Error creating case ${caseData.title}:`, error);
    }
  }

  console.log("Learning cases seeding completed!");
}

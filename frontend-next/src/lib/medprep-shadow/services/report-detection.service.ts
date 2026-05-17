"use client"

export interface DetectedTest {
  type: string
  category: "imaging" | "lab" | "special" | "other"
  confidence: number
  originalText: string
}

export interface ReportDetectionResult {
  detectedTests: DetectedTest[]
  hasRecommendations: boolean
  triggerText: string
}

class ReportDetectionService {
  private testPatterns = {
    imaging: [
      { pattern: /\b(?:CT|CAT)\s+scan\b/i, type: "CT Scan" },
      { pattern: /\bMRI\s+(?:scan|imaging)\b/i, type: "MRI" },
      { pattern: /\bX-?ray\b/i, type: "X-Ray" },
      { pattern: /\bchest\s+X-?ray\b/i, type: "Chest X-Ray" },
      { pattern: /\bultrasound\b/i, type: "Ultrasound" },
      { pattern: /\bradiology\s+(?:report|study|exam)\b/i, type: "Radiology Report" },
      { pattern: /\bimaging\s+(?:studies|tests)\b/i, type: "Imaging Studies" },
      { pattern: /\bPET\s+scan\b/i, type: "PET Scan" },
      { pattern: /\bMammogram\b/i, type: "Mammogram" },
      { pattern: /\bBone\s+scan\b/i, type: "Bone Scan" },
    ],
    lab: [
      { pattern: /\b(?:blood\s+)?test\b/i, type: "Blood Test" },
      { pattern: /\bCBC\b/i, type: "Complete Blood Count (CBC)" },
      { pattern: /\bcomplete\s+blood\s+count\b/i, type: "Complete Blood Count (CBC)" },
      { pattern: /\bBMP\b/i, type: "Basic Metabolic Panel" },
      { pattern: /\bCMP\b/i, type: "Comprehensive Metabolic Panel" },
      { pattern: /\bmetabolic\s+panel\b/i, type: "Metabolic Panel" },
      { pattern: /\bthorough\s+workup\b/i, type: "Comprehensive Lab Workup" },
      { pattern: /\blab\s+(?:tests|workup)\b/i, type: "Laboratory Tests" },
      { pattern: /\burinalysis\b/i, type: "Urinalysis" },
      { pattern: /\b(?:liver|hepatic)\s+function\s+test\b/i, type: "Liver Function Test" },
      { pattern: /\b(?:kidney|renal)\s+function\s+test\b/i, type: "Kidney Function Test" },
      { pattern: /\bthyroid\s+(?:function\s+)?test\b/i, type: "Thyroid Function Test" },
      { pattern: /\bglucose\s+(?:test|level)\b/i, type: "Glucose Test" },
      { pattern: /\bcholesterol\s+(?:test|panel)\b/i, type: "Cholesterol Panel" },
      { pattern: /\bcoagulation\s+(?:test|panel)\b/i, type: "Coagulation Panel" },
      { pattern: /\bsputum\s+culture\b/i, type: "Sputum Culture" },
    ],
    special: [
      { pattern: /\b(?:neurological|neuro)\s+(?:exam|assessment|evaluation)\b/i, type: "Neurological Exam" },
      { pattern: /\bECG\b/i, type: "Electrocardiogram (ECG)" },
      { pattern: /\bEKG\b/i, type: "Electrocardiogram (EKG)" },
      { pattern: /\bEEG\b/i, type: "Electroencephalogram (EEG)" },
      { pattern: /\bpathology\s+(?:report|study)\b/i, type: "Pathology Report" },
      { pattern: /\bendoscopy\b/i, type: "Endoscopy" },
      { pattern: /\bcolonoscopy\b/i, type: "Colonoscopy" },
      { pattern: /\b(?:pulmonary|lung)\s+function\s+test\b/i, type: "Pulmonary Function Test" },
      { pattern: /\bpulmonary\s+function\s+tests\b/i, type: "Pulmonary Function Tests" },
      { pattern: /\b(?:cardiac|stress)\s+test\b/i, type: "Cardiac Stress Test" },
      { pattern: /\b(?:cardiac\s+)?troponin\b/i, type: "Cardiac Troponin" },
      { pattern: /\bcardiac\s+biomarkers\b/i, type: "Cardiac Biomarkers" },
      { pattern: /\bcardiac\s+enzymes\b/i, type: "Cardiac Enzymes" },
      { pattern: /\b(?:allergy|skin)\s+test\b/i, type: "Allergy Test" },
    ],
    other: [
      { pattern: /\b(?:biopsy|tissue\s+sample)\b/i, type: "Biopsy" },
      { pattern: /\b(?:culture|microbiology)\s+(?:test|study)\b/i, type: "Microbiology Culture" },
      { pattern: /\b(?:genetic|DNA)\s+test\b/i, type: "Genetic Test" },
      { pattern: /\b(?:drug|medication)\s+level\b/i, type: "Drug Level Test" },
    ],
  }

  private recommendationTriggers = [
    /\b(?:recommend|suggest|order|request|need|require|indicate|warrant)\b/i,
    /\b(?:should|must|ought\s+to|would\s+benefit\s+from)\b/i,
    /\b(?:consider|evaluate|assess|investigate)\b/i,
    /\b(?:rule\s+out|exclude|confirm|diagnose)\b/i,
    /\b(?:will\s+consider|will\s+order|will\s+request)\b/i,
    /\b(?:important\s+to|essential\s+to|necessary\s+to)\b/i,
    /\b(?:guide\s+further|further\s+evaluation)\b/i,
    /\b(?:thorough\s+workup|comprehensive\s+workup)\b/i,
    /suggestedtests?:/i,
  ]

  analyzeDoctorThought(thoughtText: string, _debug = false): ReportDetectionResult {
    if (!thoughtText || thoughtText.trim().length === 0) {
      return { detectedTests: [], hasRecommendations: false, triggerText: "" }
    }

    const detectedTests: DetectedTest[] = []

    const hasRecommendationLanguage = this.recommendationTriggers.some((trigger) =>
      trigger.test(thoughtText),
    )

    if (!hasRecommendationLanguage) {
      return { detectedTests: [], hasRecommendations: false, triggerText: "" }
    }

    Object.entries(this.testPatterns).forEach(([category, patterns]) => {
      patterns.forEach(({ pattern, type }) => {
        const match = thoughtText.match(pattern)
        if (match) {
          detectedTests.push({
            type,
            category: category as DetectedTest["category"],
            confidence: 0.85,
            originalText: match[0],
          })
        }
      })
    })

    const unique = this.deduplicateTests(detectedTests)
    return {
      detectedTests: unique,
      hasRecommendations: unique.length > 0,
      triggerText: thoughtText.slice(0, 200),
    }
  }

  private deduplicateTests(tests: DetectedTest[]): DetectedTest[] {
    const unique: DetectedTest[] = []
    tests.forEach((test) => {
      const existingIndex = unique.findIndex((t) => t.type === test.type)
      if (existingIndex === -1) {
        unique.push(test)
      } else if (test.confidence > unique[existingIndex].confidence) {
        unique[existingIndex] = test
      }
    })
    return unique
  }

  getTestCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      imaging: "🩻",
      lab: "🧪",
      special: "🔬",
      other: "📋",
    }
    return icons[category] || "📋"
  }

  getTestCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      imaging: "text-blue-600",
      lab: "text-green-600",
      special: "text-purple-600",
      other: "text-gray-600",
    }
    return colors[category] || "text-gray-600"
  }
}

export const reportDetectionService = new ReportDetectionService()

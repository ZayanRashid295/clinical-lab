export interface DifferentialDiagnosisItem {
  condition: string;
  probability: number;
  reason: string;
  category: "primary" | "secondary" | "rare" | "rule-out";
}

export class DifferentialDiagnosisService {
  async generateDifferentialDiagnosis(
    context: any
  ): Promise<DifferentialDiagnosisItem[]> {
    // Mock implementation - in real app, this would call an AI service
    const mockDiagnosis: DifferentialDiagnosisItem[] = [
      {
        condition: "Primary Diagnosis",
        probability: Math.floor(Math.random() * 40) + 30,
        reason: "Most likely based on presenting symptoms and history",
        category: "primary",
      },
      {
        condition: "Secondary Consideration",
        probability: Math.floor(Math.random() * 30) + 20,
        reason: "Alternative diagnosis requiring further evaluation",
        category: "secondary",
      },
      {
        condition: "Rare Condition",
        probability: Math.floor(Math.random() * 15) + 5,
        reason: "Less common but important to consider",
        category: "rare",
      },
      {
        condition: "Rule Out",
        probability: Math.floor(Math.random() * 10) + 5,
        reason: "Important differential requiring exclusion",
        category: "rule-out",
      },
    ];

    // Normalize probabilities to sum to 100
    const total = mockDiagnosis.reduce(
      (sum, item) => sum + item.probability,
      0
    );
    mockDiagnosis.forEach((item) => {
      item.probability = Math.round((item.probability / total) * 100);
    });

    return mockDiagnosis;
  }
}

export const differentialDiagnosisService = new DifferentialDiagnosisService();

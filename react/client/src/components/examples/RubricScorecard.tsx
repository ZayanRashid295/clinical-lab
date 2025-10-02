import { RubricScorecard } from '../RubricScorecard'

export default function RubricScorecardExample() {
  const mockCategories = [
    { name: "History Taking", score: 18, maxScore: 20 },
    { name: "Physical Examination", score: 15, maxScore: 20 },
    { name: "Investigations", score: 16, maxScore: 20 },
    { name: "Management", score: 14, maxScore: 20 },
    { name: "Documentation", score: 17, maxScore: 20 },
    { name: "Communication", score: 19, maxScore: 20 },
  ];

  return <RubricScorecard categories={mockCategories} />
}

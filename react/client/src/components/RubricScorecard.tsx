import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RubricCategory {
  name: string;
  score: number;
  maxScore: number;
}

interface RubricScorecardProps {
  categories: RubricCategory[];
  totalScore?: number;
  totalMaxScore?: number;
}

export function RubricScorecard({ categories, totalScore, totalMaxScore }: RubricScorecardProps) {
  const calculatedTotal = totalScore ?? categories.reduce((sum, cat) => sum + cat.score, 0);
  const calculatedMax = totalMaxScore ?? categories.reduce((sum, cat) => sum + cat.maxScore, 0);
  const percentage = Math.round((calculatedTotal / calculatedMax) * 100);

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "text-chart-3";
    if (pct >= 60) return "text-chart-2";
    return "text-chart-4";
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">Overall Score</h3>
          <span className={`text-3xl font-bold ${getScoreColor(calculatedTotal, calculatedMax)}`}>
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-3" />
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const catPercentage = Math.round((category.score / category.maxScore) * 100);
          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{category.name}</span>
                <span className={`font-mono ${getScoreColor(category.score, category.maxScore)}`}>
                  {category.score}/{category.maxScore}
                </span>
              </div>
              <Progress value={catPercentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

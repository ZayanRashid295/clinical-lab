import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuestionPool {
  id: string;
  label: string;
  description: string;
  count: number;
}

const pools: QuestionPool[] = [
  { id: "unused", label: "Unused", description: "Selects questions from a set of new/unseen questions", count: 3732 },
  { id: "incorrect", label: "Incorrect", description: "Selects questions that were previously answered incorrectly", count: 0 },
  { id: "marked", label: "Marked", description: "Selects questions that were previously marked/flagged for review", count: 0 },
  { id: "omitted", label: "Omitted", description: "Selects questions that were omitted previously", count: 0 },
  { id: "correct", label: "Correct", description: "Selects questions that were previously answered correctly", count: 0 },
];

interface QuestionPoolSelectorProps {
  selectedPool: string;
  onPoolChange: (pool: string) => void;
}

export function QuestionPoolSelector({ selectedPool, onPoolChange }: QuestionPoolSelectorProps) {
  return (
    <Card data-testid="card-question-pool">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Question Mode</h3>
            <span className="text-sm text-muted-foreground">Total Available: 3732</span>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2" data-testid="button-standard">
              Standard
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover-elevate active-elevate-2" data-testid="button-custom">
              Custom
            </button>
          </div>

          <RadioGroup value={selectedPool} onValueChange={onPoolChange}>
            <div className="space-y-2">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <RadioGroupItem value={pool.id} id={pool.id} data-testid={`radio-${pool.id}`} />
                    <Label htmlFor={pool.id} className="font-medium cursor-pointer flex-1">
                      {pool.label}
                    </Label>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground tabular-nums" data-testid={`count-${pool.id}`}>
                    {pool.count}
                  </span>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

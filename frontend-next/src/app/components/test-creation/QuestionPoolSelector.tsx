import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

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
            <h3 className="font-semibold text-gray-900 dark:text-gray-200">Question Mode</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Available: 3732</span>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
              Standard
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Custom
            </button>
          </div>

          <RadioGroup value={selectedPool} onValueChange={onPoolChange}>
            <div className="space-y-2">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <RadioGroupItem value={pool.id} id={pool.id} data-testid={`radio-${pool.id}`} />
                    <Label htmlFor={pool.id} className="font-medium cursor-pointer flex-1 text-gray-900 dark:text-gray-200">
                      {pool.label}
                    </Label>
                  </div>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 tabular-nums" data-testid={`count-${pool.id}`}>
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

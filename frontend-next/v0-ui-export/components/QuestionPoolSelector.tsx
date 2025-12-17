"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface QuestionPool {
  id: string;
  label: string;
  description: string;
  count: number;
}

interface QuestionPoolSelectorProps {
  selectedPool: string;
  onPoolChange: (pool: string) => void;
  filters?: {
    tagIds?: string[];
    systemIds?: string[];
    subjectIds?: string[];
    topicIds?: string[];
  };
  refreshTrigger?: number;
}

// Mock data for question pool stats
const mockStats = {
  unused: 1250,
  incorrect: 342,
  marked: 89,
  omitted: 156,
  correct: 567,
  total: 2404,
};

export function QuestionPoolSelector({
  selectedPool,
  onPoolChange,
  filters,
  refreshTrigger,
}: QuestionPoolSelectorProps) {
  const [stats, setStats] = useState<{
    unused: number;
    incorrect: number;
    marked: number;
    omitted: number;
    correct: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchStats = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStats(mockStats);
      setLoading(false);
    };

    fetchStats();
  }, [refreshTrigger]);

  const pools: QuestionPool[] = [
    {
      id: "unused",
      label: "Unused",
      description: "Selects questions from a set of new/unseen questions",
      count: stats?.unused ?? 0,
    },
    {
      id: "incorrect",
      label: "Incorrect",
      description:
        "Selects questions that were previously answered incorrectly",
      count: stats?.incorrect ?? 0,
    },
    {
      id: "omitted",
      label: "Omitted",
      description: "Selects questions that were omitted previously",
      count: stats?.omitted ?? 0,
    },
    {
      id: "correct",
      label: "Correct",
      description: "Selects questions that were previously answered correctly",
      count: stats?.correct ?? 0,
    },
  ];

  const totalAvailable = stats?.total ?? 0;

  return (
    <Card data-testid="card-question-pool">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-200">
              Question Mode
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="block mb-1">Unused</strong>
                    <p className="text-xs opacity-90">
                      Selects questions from a set of new/unseen questions
                    </p>
                  </div>
                  <div>
                    <strong className="block mb-1">Incorrect</strong>
                    <p className="text-xs opacity-90">
                      Selects questions that were previously answered
                      incorrectly
                    </p>
                  </div>
                  <div>
                    <strong className="block mb-1">Omitted</strong>
                    <p className="text-xs opacity-90">
                      Selects questions that were omitted previously
                    </p>
                  </div>
                  <div>
                    <strong className="block mb-1">Correct</strong>
                    <p className="text-xs opacity-90">
                      Selects questions that were previously answered correctly
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? "Loading..." : `Total Available: ${totalAvailable}`}
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            {pools.map((pool) => (
              <div key={pool.id} className="flex items-center space-x-2">
                <Checkbox
                  id={pool.id}
                  checked={selectedPool === pool.id}
                  onCheckedChange={() => onPoolChange(pool.id)}
                  data-testid={`checkbox-${pool.id}`}
                />
                <Label
                  htmlFor={pool.id}
                  className="font-medium cursor-pointer text-gray-900 dark:text-gray-200"
                >
                  {pool.label}
                </Label>
                <span
                  className="text-sm font-mono text-gray-600 dark:text-gray-400 tabular-nums"
                  data-testid={`count-${pool.id}`}
                >
                  {loading ? "..." : pool.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}















































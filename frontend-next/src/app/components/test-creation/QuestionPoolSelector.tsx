import React, { useState, useEffect } from "react";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { Sparkles, XCircle, CircleDashed, CheckCircle, Loader2, Layers } from "lucide-react";

interface QuestionPool {
  id: string;
  label: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface QuestionPoolSelectorProps {
  selectedPool: string;
  onPoolChange: (pool: string) => void;
  filters?: {
    systemIds?: string[];
    topicIds?: string[];
    subtopicIds?: string[];
  };
  isMarked?: boolean; // If true, apply AND logic to show only questions that are in pool AND marked
}

export function QuestionPoolSelector({ 
  selectedPool, 
  onPoolChange,
  filters,
  isMarked,
}: QuestionPoolSelectorProps) {
  const [stats, setStats] = useState<{
    unused: number;
    incorrect: number;
    marked: number;
    omitted: number;
    correct: number;
    total: number;
  } | null>(null);

  const questionPapersService = new QuestionPapersService();

  const fetchStats = async () => {
    try {
      // Fetch stats with filters to ensure counts reflect the current selections
      const data = await questionPapersService.getUserQuestionPoolStats({
        ...filters,
        marked: isMarked ? true : undefined,
      });
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch question pool stats:", error);
      // Set default values on error
      setStats({
        unused: 0,
        incorrect: 0,
        marked: 0,
        omitted: 0,
        correct: 0,
        total: 0,
      });
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarked, filters]); // Refresh when isMarked or other filters change

  const pools: QuestionPool[] = [
    {
      id: "unused",
      label: "Unused",
      description: "Selects questions from a set of new/unseen questions",
      count: stats?.unused ?? 0,
      icon: <Sparkles className="h-3.5 w-3.5" />,
      color: "text-blue-400 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      id: "incorrect",
      label: "Incorrect",
      description: "Selects questions that were previously answered incorrectly",
      count: stats?.incorrect ?? 0,
      icon: <XCircle className="h-3.5 w-3.5" />,
      color: "text-red-400 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20",
    },
    {
      id: "omitted",
      label: "Omitted",
      description: "Selects questions that were omitted previously",
      count: stats?.omitted ?? 0,
      icon: <CircleDashed className="h-3.5 w-3.5" />,
      color: "text-amber-400 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      id: "correct",
      label: "Correct",
      description: "Selects questions that were previously answered correctly",
      count: stats?.correct ?? 0,
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      color: "text-emerald-400 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
  ];

  const totalAvailable = stats?.total ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5" data-testid="card-question-pool">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">Question Pool</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {pools.map((pool) => {
            const isSelected = selectedPool === pool.id;
            return (
              <button
                key={pool.id}
                onClick={() => onPoolChange(pool.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg text-center transition-all ${
                  isSelected
                    ? pool.id === "unused"
                      ? "bg-blue-500 dark:bg-blue-600 text-white shadow-sm"
                      : pool.id === "correct"
                        ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm"
                        : pool.id === "incorrect"
                          ? "bg-red-500 dark:bg-red-600 text-white shadow-sm"
                          : "bg-amber-500 dark:bg-amber-600 text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-slate-100"
                }`}
                data-testid={`checkbox-${pool.id}`}
              >
                <div className={`p-1 rounded ${isSelected ? "bg-white/20" : pool.color}`}>{pool.icon}</div>
                <span className="text-[11px] font-medium">{pool.label}</span>
                <span className={`text-sm font-bold tabular-nums ${isSelected ? "" : "text-gray-900 dark:text-slate-100"}`}>
                  {pool.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

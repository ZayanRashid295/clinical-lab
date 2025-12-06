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
    tagIds?: string[];
    systemIds?: string[];
    subjectIds?: string[];
    topicIds?: string[];
  };
  isMarked?: boolean; // If true, apply AND logic to show only questions that are in pool AND marked
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export function QuestionPoolSelector({ 
  selectedPool, 
  onPoolChange,
  filters,
  isMarked,
  refreshTrigger 
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

  const questionPapersService = new QuestionPapersService();

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch stats without tag/system/subject/topic filters to keep counts static
      // But include marked filter if enabled (AND logic)
      const data = await questionPapersService.getUserQuestionPoolStats({
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, isMarked]); // Refresh when refreshTrigger or isMarked changes, but NOT when other filters change

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
    <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 overflow-hidden" data-testid="card-question-pool">
      <div className="px-4 py-3 border-b border-border/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Question Pool</h3>
                  </div>
                </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground dark:text-gray-400" />
          </div>
        ) : (
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
                      : "bg-muted/50 dark:bg-gray-700/30 text-muted-foreground hover:bg-muted dark:hover:bg-gray-700/50 hover:text-foreground dark:hover:text-foreground"
                  }`}
                  data-testid={`checkbox-${pool.id}`}
                >
                  <div className={`p-1 rounded ${isSelected ? "bg-white/20" : pool.color}`}>{pool.icon}</div>
                  <span className="text-[11px] font-medium">{pool.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${isSelected ? "" : "text-foreground dark:text-gray-100"}`}>
                    {pool.count.toLocaleString()}
                  </span>
                </button>
              );
            })}
                </div>
        )}
            </div>
        </div>
  );
}

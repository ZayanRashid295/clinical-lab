"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/shared/ui/switch";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";

interface MarkedToggleProps {
  isMarked: boolean;
  onMarkedChange: (marked: boolean) => void;
  selectedPool?: string;
  refreshTrigger?: number;
}

export function MarkedToggle({ isMarked, onMarkedChange, selectedPool, refreshTrigger }: MarkedToggleProps) {
  const [markedCount, setMarkedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const questionPapersService = new QuestionPapersService();

  useEffect(() => {
    const fetchMarkedCount = async () => {
      try {
        setLoading(true);
        // Fetch stats to get marked count
        const data = await questionPapersService.getUserQuestionPoolStats(undefined);
        setMarkedCount(data.marked);
      } catch (error) {
        console.error("Failed to fetch marked count:", error);
        setMarkedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkedCount();
  }, [refreshTrigger]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5" data-testid="card-marked-toggle">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Marked Questions</h3>
          </div>
          <span className="text-xs text-muted-foreground dark:text-gray-400">
            {loading ? "..." : `${markedCount?.toLocaleString() ?? 0} marked`}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground dark:text-gray-100">Include marked questions</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">Filter questions marked for review</p>
          </div>
          <Switch checked={isMarked} onCheckedChange={onMarkedChange} data-testid="switch-marked" />
        </div>
      </div>
    </div>
  );
}


































































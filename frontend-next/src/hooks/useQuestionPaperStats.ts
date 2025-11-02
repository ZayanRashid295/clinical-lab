import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionPapersService } from "../app/services/assessments/question-papers.service";

interface QuestionPaperStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
}

interface UseQuestionPaperStatsResult {
  stats: QuestionPaperStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useQuestionPaperStats = (): UseQuestionPaperStatsResult => {
  const [stats, setStats] = useState<QuestionPaperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionPapersService = useMemo(() => new QuestionPapersService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionPapersService.getQuestionPaperStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question paper stats"
      );
    } finally {
      setLoading(false);
    }
  }, [questionPapersService]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export default useQuestionPaperStats;


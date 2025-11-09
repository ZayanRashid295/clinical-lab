import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionsService } from "../app/services/questions/questions.service";

interface QuestionStats {
  total: number;
  active: number;
  inactive: number;
  byDifficulty: Record<string, number>;
}

interface UseQuestionStatsResult {
  stats: QuestionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useQuestionStats = (): UseQuestionStatsResult => {
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionsService = useMemo(() => new QuestionsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionsService.getQuestionStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch question stats"
      );
    } finally {
      setLoading(false);
    }
  }, [questionsService]);

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

export default useQuestionStats;


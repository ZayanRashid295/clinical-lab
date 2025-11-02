import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionChoicesService } from "../app/services/questions/question-choices.service";

interface QuestionChoiceStats {
  total: number;
  correct: number;
  incorrect: number;
}

interface UseQuestionChoiceStatsResult {
  stats: QuestionChoiceStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useQuestionChoiceStats = (): UseQuestionChoiceStatsResult => {
  const [stats, setStats] = useState<QuestionChoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionChoicesService = useMemo(() => new QuestionChoicesService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionChoicesService.getQuestionChoiceStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question choice stats"
      );
    } finally {
      setLoading(false);
    }
  }, [questionChoicesService]);

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

export default useQuestionChoiceStats;


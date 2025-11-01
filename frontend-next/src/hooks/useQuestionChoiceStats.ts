import { useState, useEffect } from "react";
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

  const questionChoicesService = new QuestionChoicesService();

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export default useQuestionChoiceStats;


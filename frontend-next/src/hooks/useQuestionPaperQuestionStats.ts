import { useState, useEffect } from "react";
import { QuestionPaperQuestionsService } from "../app/services/assessments/question-paper-questions.service";

interface QuestionPaperQuestionStats {
  total: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
}

interface UseQuestionPaperQuestionStatsResult {
  stats: QuestionPaperQuestionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useQuestionPaperQuestionStats = (): UseQuestionPaperQuestionStatsResult => {
  const [stats, setStats] = useState<QuestionPaperQuestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionPaperQuestionsService = new QuestionPaperQuestionsService();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await questionPaperQuestionsService.getQuestionPaperQuestionStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question paper question stats"
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

export default useQuestionPaperQuestionStats;


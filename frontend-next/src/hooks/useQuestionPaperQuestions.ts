import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionPaperQuestionsService } from "../app/services/assessments/question-paper-questions.service";
import {
  QuestionPaperQuestion,
  QuestionPaperQuestionQueryParams,
} from "../app/types/question-paper-question";

interface UseQuestionPaperQuestionsResult {
  questionPaperQuestions: QuestionPaperQuestion[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (
    newFilters: Partial<QuestionPaperQuestionQueryParams>
  ) => void;
  filters: QuestionPaperQuestionQueryParams;
}

const useQuestionPaperQuestions = (
  initialFilters: QuestionPaperQuestionQueryParams = {}
): UseQuestionPaperQuestionsResult => {
  const [questionPaperQuestions, setQuestionPaperQuestions] = useState<
    QuestionPaperQuestion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] =
    useState<QuestionPaperQuestionQueryParams>({
      page: 1,
      limit: 10,
      sortBy: "order",
      sortOrder: "asc",
      ...initialFilters,
    });

  const questionPaperQuestionsService = useMemo(() => new QuestionPaperQuestionsService(), []);

  const fetchQuestionPaperQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await questionPaperQuestionsService.getQuestionPaperQuestions(filters);

      if (Array.isArray(response)) {
        setQuestionPaperQuestions(response);
        setPagination(null);
      } else {
        setQuestionPaperQuestions(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question paper questions"
      );
      setQuestionPaperQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [questionPaperQuestionsService, filters]);

  useEffect(() => {
    fetchQuestionPaperQuestions();
  }, [fetchQuestionPaperQuestions]);

  const updateFilters = useCallback(
    (newFilters: Partial<QuestionPaperQuestionQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchQuestionPaperQuestions();
  }, [fetchQuestionPaperQuestions]);

  return {
    questionPaperQuestions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useQuestionPaperQuestions;


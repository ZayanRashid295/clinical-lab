import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionsService } from "../app/services/questions/questions.service";
import { Question, QuestionQueryParams } from "../app/types/question";

interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<QuestionQueryParams>) => void;
  filters: QuestionQueryParams;
}

const useQuestions = (
  initialFilters: QuestionQueryParams = {}
): UseQuestionsResult => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<QuestionQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const questionsService = useMemo(() => new QuestionsService(), []);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await questionsService.getQuestions(filters);

      if (Array.isArray(response)) {
        setQuestions(response);
        setPagination(null);
      } else {
        setQuestions(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch questions"
      );
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [questionsService, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const updateFilters = useCallback(
    (newFilters: Partial<QuestionQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useQuestions;


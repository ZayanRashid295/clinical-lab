import { useState, useEffect, useCallback } from "react";
import { QuestionChoicesService } from "../app/services/questions/question-choices.service";
import {
  QuestionChoice,
  QuestionChoiceQueryParams,
} from "../app/types/question";

interface UseQuestionChoicesResult {
  questionChoices: QuestionChoice[];
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
    newFilters: Partial<QuestionChoiceQueryParams>
  ) => void;
  filters: QuestionChoiceQueryParams;
}

const useQuestionChoices = (
  initialFilters: QuestionChoiceQueryParams = {}
): UseQuestionChoicesResult => {
  const [questionChoices, setQuestionChoices] = useState<QuestionChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<QuestionChoiceQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "order",
    sortOrder: "asc",
    ...initialFilters,
  });

  const questionChoicesService = new QuestionChoicesService();

  const fetchQuestionChoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await questionChoicesService.getQuestionChoices(filters);

      if (Array.isArray(response)) {
        setQuestionChoices(response);
        setPagination(null);
      } else {
        setQuestionChoices(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question choices"
      );
      setQuestionChoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQuestionChoices();
  }, [fetchQuestionChoices]);

  const updateFilters = useCallback(
    (newFilters: Partial<QuestionChoiceQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchQuestionChoices();
  }, [fetchQuestionChoices]);

  return {
    questionChoices,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useQuestionChoices;


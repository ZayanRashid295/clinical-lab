import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionPapersService } from "../app/services/assessments/question-papers.service";
import {
  QuestionPaper,
  QuestionPaperQueryParams,
} from "../app/types/assessment";

interface UseQuestionPapersResult {
  questionPapers: QuestionPaper[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<QuestionPaperQueryParams>) => void;
  filters: QuestionPaperQueryParams;
}

const useQuestionPapers = (
  initialFilters: QuestionPaperQueryParams = {}
): UseQuestionPapersResult => {
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<QuestionPaperQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const questionPapersService = useMemo(() => new QuestionPapersService(), []);

  const fetchQuestionPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await questionPapersService.getQuestionPapers(filters);

      if (Array.isArray(response)) {
        setQuestionPapers(response);
        setPagination(null);
      } else {
        setQuestionPapers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch question papers"
      );
      setQuestionPapers([]);
    } finally {
      setLoading(false);
    }
  }, [questionPapersService, filters]);

  useEffect(() => {
    fetchQuestionPapers();
  }, [fetchQuestionPapers]);

  const updateFilters = useCallback(
    (newFilters: Partial<QuestionPaperQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const refetch = useCallback(() => {
    fetchQuestionPapers();
  }, [fetchQuestionPapers]);

  return {
    questionPapers,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
    filters,
  };
};

export default useQuestionPapers;


import { useState, useEffect, useCallback, useMemo } from "react";
import { SubtopicsService } from "../app/services/content/subtopics.service";

interface SubtopicStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseSubtopicStatsResult {
  stats: SubtopicStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useSubtopicStats = (): UseSubtopicStatsResult => {
  const [stats, setStats] = useState<SubtopicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtopicsService = useMemo(() => new SubtopicsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subtopicsService.getSubtopicStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch subtopic stats"
      );
    } finally {
      setLoading(false);
    }
  }, [subtopicsService]);

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

export default useSubtopicStats;

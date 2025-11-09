import { useState, useEffect, useCallback, useMemo } from "react";
import { TopicsService } from "../app/services/content/topics.service";

interface TopicStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseTopicStatsResult {
  stats: TopicStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useTopicStats = (): UseTopicStatsResult => {
  const [stats, setStats] = useState<TopicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topicsService = useMemo(() => new TopicsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await topicsService.getTopicStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch topic stats"
      );
    } finally {
      setLoading(false);
    }
  }, [topicsService]);

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

export default useTopicStats;


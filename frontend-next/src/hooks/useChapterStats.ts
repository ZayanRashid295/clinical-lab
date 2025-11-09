import { useState, useEffect, useCallback, useMemo } from "react";
import { ChaptersService } from "../app/services/content/chapters.service";

interface ChapterStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseChapterStatsResult {
  stats: ChapterStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useChapterStats = (): UseChapterStatsResult => {
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chaptersService = useMemo(() => new ChaptersService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await chaptersService.getChapterStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch chapter stats"
      );
    } finally {
      setLoading(false);
    }
  }, [chaptersService]);

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

export default useChapterStats;


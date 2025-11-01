import { useState, useEffect } from "react";
import { SectionsService } from "../app/services/content/sections.service";

interface SectionStats {
  total: number;
  active: number;
  inactive: number;
}

interface UseSectionStatsResult {
  stats: SectionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const useSectionStats = (): UseSectionStatsResult => {
  const [stats, setStats] = useState<SectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectionsService = new SectionsService();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sectionsService.getSectionStats();
      setStats(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch section stats"
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

export default useSectionStats;


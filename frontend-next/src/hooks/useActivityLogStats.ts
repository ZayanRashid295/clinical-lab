import { useState, useEffect, useCallback, useMemo } from "react";
import { ActivityLogsService } from "../app/services/admin/activity-logs.service";
import { ActivityLogStats } from "../app/types/activity-log";

export default function useActivityLogStats() {
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => new ActivityLogsService(), []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

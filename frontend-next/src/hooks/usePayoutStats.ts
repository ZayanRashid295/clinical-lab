import { useState, useEffect, useCallback } from "react";
import { apiService } from "../shared";

interface PayoutStats {
  payouts: {
    total: number;
    totalAmount?: number; // Optional for backward compatibility
    completed: number;
    pending: number;
    failed: number;
  };
  earnings: {
    total: number;
    totalAmount?: number; // Optional for backward compatibility
    pending: number;
    pendingAmount?: number; // Optional for backward compatibility
  };
}

interface UsePayoutStatsResult {
  stats: PayoutStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Unified hook for payout statistics (both general and driver-specific)
export const usePayoutStats = (driverId?: string): UsePayoutStatsResult => {
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (driverId === undefined) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use appropriate API endpoint based on whether driverId is provided
      const response = driverId
        ? await apiService.getDriverPayoutStats(driverId)
        : await apiService.getPayoutStats();

      if (response) {
        setStats(response);
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Error fetching payout stats:", err);

      setError(
        err instanceof Error ? err.message : "Failed to fetch payout statistics"
      );
    } finally {
      setLoading(false);
    }
  }, [driverId]);

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

// Convenience hook for driver-specific stats (backward compatibility)
export const useDriverPayoutStats = (
  driverId: string
): UsePayoutStatsResult => {
  return usePayoutStats(driverId);
};

const payoutStatsHooks = { usePayoutStats, useDriverPayoutStats };
export default payoutStatsHooks;

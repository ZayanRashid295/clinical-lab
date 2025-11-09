import { useState, useEffect, useCallback } from "react";
import {
  PayoutSettings,
  PayoutMethod,
  PayoutFrequency,
} from "../app/types/payout";
import { apiService } from "../shared";

interface UsePayoutSettingsResult {
  settings: PayoutSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateSettings: (settingsData: Partial<PayoutSettings>) => Promise<void>;
}

const usePayoutSettings = (driverId: string): UsePayoutSettingsResult => {
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use real API
      const response = await apiService.getPayoutSettings(driverId);

      if (response) {
        setSettings(response);
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error("Error fetching payout settings:", err);

      setError(
        err instanceof Error ? err.message : "Failed to fetch payout settings"
      );
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  const updateSettings = useCallback(
    async (settingsData: Partial<PayoutSettings>) => {
      if (!driverId) {
        throw new Error("Driver ID is required");
      }

      try {
        setError(null);

        // Use real API
        const response = await apiService.updatePayoutSettings(
          driverId,
          settingsData
        );

        if (response) {
          setSettings(response);
        }
      } catch (err) {
        console.error("Error updating payout settings:", err);

        throw err;
      }
    },
    [driverId]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refetch = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch,
    updateSettings,
  };
};

export default usePayoutSettings;

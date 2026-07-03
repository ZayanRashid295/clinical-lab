import { useState, useEffect, useCallback, useMemo } from "react";
import { ActivityLogsService } from "../app/services/admin/activity-logs.service";
import {
  ActivityLog,
  ActivityLogFilterOptions,
  ActivityLogQueryParams,
} from "../app/types/activity-log";

interface UseActivityLogsResult {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  filterOptions: ActivityLogFilterOptions | null;
  refetch: () => void;
  updateFilters: (newFilters: Partial<ActivityLogQueryParams>) => void;
  filters: ActivityLogQueryParams;
  exportCsv: () => Promise<void>;
  exporting: boolean;
}

const useActivityLogs = (
  initialFilters: ActivityLogQueryParams = {},
): UseActivityLogsResult => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<ActivityLogFilterOptions | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [filters, setFilters] = useState<ActivityLogQueryParams>({
    page: 1,
    limit: 25,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  const service = useMemo(() => new ActivityLogsService(), []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await service.getLogs(filters);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activity logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [service, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    service
      .getFilterOptions()
      .then(setFilterOptions)
      .catch(() => undefined);
  }, [service]);

  const updateFilters = useCallback(
    (newFilters: Partial<ActivityLogQueryParams>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const refetch = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportCsv = useCallback(async () => {
    try {
      setExporting(true);
      const blob = await service.exportCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export logs");
    } finally {
      setExporting(false);
    }
  }, [service, filters]);

  return {
    logs,
    loading,
    error,
    pagination,
    filterOptions,
    refetch,
    updateFilters,
    filters,
    exportCsv,
    exporting,
  };
};

export default useActivityLogs;

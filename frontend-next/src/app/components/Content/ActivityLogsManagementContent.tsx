import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  LayoutGrid,
  RefreshCw,
  Search,
  Table,
  X,
} from "lucide-react";
import useActivityLogs from "../../../hooks/useActivityLogs";
import useActivityLogStats from "../../../hooks/useActivityLogStats";
import { ActivityLog, ActivityLogFilterOptions } from "../../types/activity-log";
import ActivityLogStatsBar from "../ActivityLogs/ActivityLogStatsBar";
import ActivityLogFeed from "../ActivityLogs/ActivityLogFeed";
import ActivityLogTableView from "../ActivityLogs/ActivityLogTableView";
import ActivityLogDetailPanel from "../ActivityLogs/ActivityLogDetailPanel";
import PaginationComponent from "../Users/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_EMPTY_VALUE,
} from "@/shared/ui/select";

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <Select
        value={value || SELECT_EMPTY_VALUE}
        onValueChange={(v) =>
          onChange(v === SELECT_EMPTY_VALUE ? undefined : v)
        }
      >
        <SelectTrigger className="w-full h-[38px] rounded-lg border-gray-300 bg-white shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[280px]">
          <SelectItem value={SELECT_EMPTY_VALUE}>{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ActivityLogFilters({
  filters,
  filterOptions,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onChange,
  onClear,
}: {
  filters: Record<string, unknown>;
  filterOptions: ActivityLogFilterOptions | null;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onChange: (patch: Record<string, unknown>) => void;
  onClear: () => void;
}) {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.component ||
      filters.eventName ||
      filters.dateFrom ||
      filters.dateTo,
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by name, email, context, or IP…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FilterSelect
          label="Component"
          value={(filters.component as string) ?? ""}
          placeholder="All components"
          options={filterOptions?.components ?? []}
          onChange={(component) => onChange({ component, page: 1 })}
        />

        <FilterSelect
          label="Event"
          value={(filters.eventName as string) ?? ""}
          placeholder="All events"
          options={filterOptions?.events ?? []}
          onChange={(eventName) => onChange({ eventName, page: 1 })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            From
          </label>
          <input
            type="date"
            value={(filters.dateFrom as string) ?? ""}
            onChange={(e) =>
              onChange({ dateFrom: e.target.value || undefined, page: 1 })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            To
          </label>
          <input
            type="date"
            value={(filters.dateTo as string) ?? ""}
            onChange={(e) =>
              onChange({ dateTo: e.target.value || undefined, page: 1 })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ActivityLogsManagementContent() {
  const [viewMode, setViewMode] = useState<"feed" | "table">("feed");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const {
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
  } = useActivityLogs({ page: 1, limit: 25 });

  const { stats, loading: statsLoading, refetch: refetchStats } = useActivityLogStats();

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    updateFilters({
      search: undefined,
      component: undefined,
      eventName: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    });
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  const handleSelectLog = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const resultSummary = useMemo(() => {
    if (!pagination) return null;
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    if (pagination.total === 0) return "No matching events";
    return `Showing ${start}–${end} of ${pagination.total.toLocaleString()} events`;
  }, [pagination]);

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            A live trail of who did what, when, and from where — sign-ins, tests,
            admin changes, and more. Click any event for full details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <ActivityLogStatsBar stats={stats} loading={statsLoading} />

      <ActivityLogFilters
        filters={filters as Record<string, unknown>}
        filterOptions={filterOptions}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onChange={(patch) => updateFilters(patch)}
        onClear={handleClearFilters}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">{resultSummary}</p>
        <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("feed")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              viewMode === "feed"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              viewMode === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Table className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {viewMode === "feed" ? (
        <ActivityLogFeed
          logs={logs}
          loading={loading}
          onSelect={handleSelectLog}
        />
      ) : loading ? (
        <ActivityLogFeed logs={[]} loading onSelect={() => undefined} />
      ) : logs.length === 0 ? (
        <ActivityLogFeed logs={[]} loading={false} onSelect={() => undefined} />
      ) : (
        <ActivityLogTableView logs={logs} onSelect={handleSelectLog} />
      )}

      {pagination && pagination.total > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {pagination.totalPages > 1 ? (
            <PaginationComponent
              pagination={pagination}
              onPageChange={(page) => updateFilters({ page })}
              onPageSizeChange={(limit) => updateFilters({ limit, page: 1 })}
            />
          ) : (
            <div className="px-6 py-3 text-sm text-gray-500 border-t border-gray-100">
              Page 1 of 1 · {pagination.total} event{pagination.total === 1 ? "" : "s"}
            </div>
          )}
        </div>
      )}

      <ActivityLogDetailPanel
        log={selectedLog}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}

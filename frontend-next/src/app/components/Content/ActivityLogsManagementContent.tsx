import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  LayoutGrid,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Table,
  X,
} from "lucide-react";
import useActivityLogs from "../../../hooks/useActivityLogs";
import useActivityLogStats from "../../../hooks/useActivityLogStats";
import { ActivityLog, ActivityLogFilterOptions } from "../../types/activity-log";
import ActivityLogStatsBar from "../ActivityLogs/ActivityLogStatsBar";
import ActivityLogQuickFilters from "../ActivityLogs/ActivityLogQuickFilters";
import ActivityLogFeed from "../ActivityLogs/ActivityLogFeed";
import ActivityLogTableView from "../ActivityLogs/ActivityLogTableView";
import ActivityLogDetailPanel from "../ActivityLogs/ActivityLogDetailPanel";
import { getDateRangeForPreset } from "../ActivityLogs/activity-log.utils";
import PaginationComponent from "../Users/Pagination";

function AdvancedFilters({
  filters,
  filterOptions,
  onChange,
  onClear,
}: {
  filters: Record<string, unknown>;
  filterOptions: ActivityLogFilterOptions | null;
  onChange: (patch: Record<string, unknown>) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Component
        </label>
        <select
          value={(filters.component as string) ?? ""}
          onChange={(e) =>
            onChange({ component: e.target.value || undefined, page: 1 })
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All components</option>
          {filterOptions?.components.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Event type
        </label>
        <select
          value={(filters.eventName as string) ?? ""}
          onChange={(e) =>
            onChange({ eventName: e.target.value || undefined, page: 1 })
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All events</option>
          {filterOptions?.events.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
      <div className="md:col-span-3 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Reset advanced filters
        </button>
      </div>
    </div>
  );
}

export default function ActivityLogsManagementContent() {
  const [viewMode, setViewMode] = useState<"feed" | "table">("feed");
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const hasActiveAdvanced = Boolean(
    filters.component ||
      filters.eventName ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.search,
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() || undefined, page: 1 });
  };

  const handleClearAll = () => {
    setSearchInput("");
    updateFilters({
      search: undefined,
      userId: undefined,
      affectedUserId: undefined,
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
      {/* Header */}
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

      <ActivityLogStatsBar
        stats={stats}
        loading={statsLoading}
        onFilterToday={() => {
          const range = getDateRangeForPreset("today");
          updateFilters({ ...range, page: 1 });
        }}
        onFilterComponent={(component) =>
          updateFilters({ component, dateFrom: undefined, dateTo: undefined, page: 1 })
        }
      />

      {/* Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, context, or IP…"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                showAdvanced || hasActiveAdvanced
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </form>

        <ActivityLogQuickFilters filters={filters} onApply={updateFilters} />

        {showAdvanced && (
          <AdvancedFilters
            filters={filters as Record<string, unknown>}
            filterOptions={filterOptions}
            onChange={(patch) => updateFilters(patch)}
            onClear={() =>
              updateFilters({
                component: undefined,
                eventName: undefined,
                dateFrom: undefined,
                dateTo: undefined,
                page: 1,
              })
            }
          />
        )}

        {hasActiveAdvanced && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{resultSummary}</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* View toggle + results */}
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

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  MapPin,
  MessageCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { Ride, RideStatus } from "../../types/ride";
import { toNumber } from "../../../utils/currency";

interface RidesTableProps {
  rides: Ride[];
  loading?: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onViewRide?: (ride: Ride) => void;
  onTrackRide?: (ride: Ride) => void;
  onMessageRide?: (ride: Ride) => void;
  onUpdateStatus?: (ride: Ride, status: RideStatus) => void;
}

const columnHelper = createColumnHelper<Ride>();

const RidesTable: React.FC<RidesTableProps> = ({
  rides,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewRide,
  onTrackRide,
  onMessageRide,
  onUpdateStatus,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const getStatusBadge = (status: RideStatus) => {
    const statusConfig = {
      REQUESTED: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Requested",
      },
      ACCEPTED: { bg: "bg-blue-100", text: "text-blue-800", label: "Accepted" },
      ARRIVING: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Arriving",
      },
      IN_PROGRESS: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "In Progress",
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Completed",
      },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
      NO_SHOW: { bg: "bg-gray-100", text: "text-gray-800", label: "No Show" },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Ride ID",
        cell: (info) => {
          const id = info.getValue();
          return <span>{id.slice(-8)}</span>;
        },
        size: 80,
        enableSorting: false,
      }),
      columnHelper.accessor("passengerName", {
        header: "Passenger",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("driverName", {
        header: "Driver",
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <span>{getStatusBadge(info.getValue())}</span>,
      }),
      columnHelper.accessor(
        (row) =>
          `${row.pickupAddress || "Unknown"} → ${
            row.dropoffAddress || "Unknown"
          }`,
        {
          header: "Route",
          cell: (info) => {
            const ride = info.row.original;
            return (
              <div className="max-w-xs">
                <div
                  className="text-sm text-gray-900 truncate"
                  title={ride.pickupAddress || "Unknown pickup"}
                >
                  📍 {ride.pickupAddress || "Unknown pickup"}
                </div>
                <div
                  className="text-sm text-gray-600 truncate"
                  title={ride.dropoffAddress || "Unknown dropoff"}
                >
                  🏁 {ride.dropoffAddress || "Unknown dropoff"}
                </div>
              </div>
            );
          },
          enableSorting: false,
        }
      ),
      columnHelper.accessor("fare", {
        header: "Fare",
        cell: (info) => (
          <span className="font-medium text-green-600">
            {formatCurrency(toNumber(info.getValue()))}
          </span>
        ),
      }),
      columnHelper.accessor("distance", {
        header: "Distance",
        cell: (info) => {
          const distance = info.getValue();
          return <span>{distance ? `${distance.toFixed(1)} km` : "N/A"}</span>;
        },
      }),
      columnHelper.accessor("duration", {
        header: "Duration",
        cell: (info) => <span>{formatDuration(info.getValue())}</span>,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (
          <span className="text-sm text-gray-600">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.id, {
        header: "Actions",
        cell: (info) => {
          const ride = info.row.original;
          return (
            <div className="flex gap-1">
              <button
                onClick={() => onViewRide?.(ride)}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="View details"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onTrackRide?.(ride)}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                title="Track ride"
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => onMessageRide?.(ride)}
                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                title="Send message"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          );
        },
        size: 120,
        enableSorting: false,
      }),
    ],
    [onViewRide, onTrackRide, onMessageRide]
  );

  const table = useReactTable({
    data: rides,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages ?? -1,
  });

  // Handle sorting changes
  React.useEffect(() => {
    if (sorting.length > 0 && onSortChange) {
      const sort = sorting[0];
      onSortChange(sort.id, sort.desc ? "desc" : "asc");
    }
  }, [sorting, onSortChange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 text-center text-red-600">
          <p>Error loading rides: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">RideHistory</h3>
        <div className="text-sm text-gray-500">
          {pagination
            ? `${pagination.total} total rides`
            : `${rides.length} rides`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {header.column.getIsSorted() === "desc" ? (
                              <ChevronDown size={16} />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ArrowUpDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No rides found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pagination.limit}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={pagination.page === 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 text-sm font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidesTable;

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
  Edit,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Car,
  MapPin,
  Wrench,
  Fuel,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Vehicle, VehicleStatus } from "../../types/fleet";

interface VehiclesTableProps {
  vehicles: Vehicle[];
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
  onViewVehicle?: (vehicle: Vehicle) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicle: Vehicle) => void;
}

const columnHelper = createColumnHelper<Vehicle>();

const VehiclesTable: React.FC<VehiclesTableProps> = ({
  vehicles,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewVehicle,
  onEditVehicle,
  onDeleteVehicle,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const getStatusBadge = (status: VehicleStatus) => {
    const statusConfig = {
      ACTIVE: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Active",
        icon: CheckCircle,
      },
      MAINTENANCE: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Maintenance",
        icon: Wrench,
      },
      INACTIVE: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Inactive",
        icon: XCircle,
      },
      RETIRED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Retired",
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
      icon: AlertTriangle,
    };

    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <IconComponent size={12} />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("make", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Make
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: (info) => (
          <div className="font-medium text-gray-900">
            {info.row.original.year} {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("model", {
        header: "Model",
        cell: (info) => <div className="text-gray-900">{info.getValue()}</div>,
      }),
      columnHelper.accessor("licensePlate", {
        header: "License Plate",
        cell: (info) => (
          <div className="font-mono text-sm text-gray-900">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      columnHelper.accessor("mileage", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mileage
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: (info) => (
          <div className="text-gray-900">
            {info.getValue().toLocaleString()} mi
          </div>
        ),
      }),
      columnHelper.accessor("fuelLevel", {
        header: "Fuel Level",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Fuel size={14} className="text-gray-400" />
            <span className="text-gray-900">{info.getValue()}%</span>
          </div>
        ),
      }),
      columnHelper.accessor("driverName", {
        header: "Driver",
        cell: (info) => (
          <div className="text-gray-900">{info.getValue() || "Unassigned"}</div>
        ),
      }),
      columnHelper.accessor("location", {
        header: "Location",
        cell: (info) => (
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin size={14} />
            <span className="truncate max-w-32">{info.getValue().address}</span>
          </div>
        ),
      }),
      columnHelper.accessor("nextMaintenance", {
        header: "Next Maintenance",
        cell: (info) => (
          <div className="text-gray-900">{formatDate(info.getValue())}</div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewVehicle?.(info.row.original)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onEditVehicle?.(info.row.original)}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Edit vehicle"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDeleteVehicle?.(info.row.original)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete vehicle"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      }),
    ],
    [onViewVehicle, onEditVehicle, onDeleteVehicle]
  );

  const table = useReactTable({
    data: vehicles,
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
    manualPagination: true,
    pageCount: pagination?.totalPages || -1,
  });

  // Handle sorting changes
  React.useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0];
      onSortChange?.(sort.id, sort.desc ? "desc" : "asc");
    }
  }, [sorting, onSortChange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange?.(1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onPageChange?.(pagination.totalPages)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {vehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Car className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No vehicles found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first vehicle.
          </p>
        </div>
      )}
    </div>
  );
};

export default VehiclesTable;

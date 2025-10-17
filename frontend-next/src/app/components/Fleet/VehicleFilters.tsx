import React from "react";
import { Search, Filter, X, Calendar, Car } from "lucide-react";
import {
  VehicleFilters as VehicleFiltersType,
  VehicleStatus,
} from "../../types/fleet";

interface VehicleFiltersProps {
  filters: VehicleFiltersType;
  onFiltersChange: (filters: Partial<VehicleFiltersType>) => void;
  onClearFilters: () => void;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const statusOptions: { value: VehicleStatus; label: string }[] = [
    { value: "ACTIVE", label: "Active" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "RETIRED", label: "Retired" },
  ];

  const makeOptions = [
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
    "Nissan",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Volkswagen",
    "Hyundai",
  ];

  const modelOptions = [
    "Camry",
    "Accord",
    "F-150",
    "Silverado",
    "Altima",
    "3 Series",
    "C-Class",
    "A4",
    "Jetta",
    "Elantra",
  ];

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className="bg-white rounded-lg shadow border mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={16} />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by make, model, license plate, or VIN..."
                value={filters.search || ""}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                onFiltersChange({
                  status: (e.target.value as VehicleStatus) || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Make Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Make
            </label>
            <select
              value={filters.make || ""}
              onChange={(e) =>
                onFiltersChange({
                  make: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All makes</option>
              {makeOptions.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Model Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={filters.model || ""}
              onChange={(e) =>
                onFiltersChange({
                  model: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All models</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Year From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year From
            </label>
            <input
              type="number"
              placeholder="2010"
              value={filters.yearFrom || ""}
              onChange={(e) =>
                onFiltersChange({
                  yearFrom: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Year To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year To
            </label>
            <input
              type="number"
              placeholder="2024"
              value={filters.yearTo || ""}
              onChange={(e) =>
                onFiltersChange({
                  yearTo: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Mileage From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage From
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.mileageFrom || ""}
              onChange={(e) =>
                onFiltersChange({
                  mileageFrom: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Mileage To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage To
            </label>
            <input
              type="number"
              placeholder="100000"
              value={filters.mileageTo || ""}
              onChange={(e) =>
                onFiltersChange({
                  mileageTo: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleFilters;

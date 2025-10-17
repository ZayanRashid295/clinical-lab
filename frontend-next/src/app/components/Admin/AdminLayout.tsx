import React, { useState } from "react";
import {
  Users,
  Shield,
  Settings,
  BarChart3,
  FileText,
  Search,
  Filter,
  Plus,
} from "lucide-react";

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  stats: Array<{
    label: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
  }>;
  filters: Array<{
    type: "search" | "select";
    key: string;
    label: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  data: any[];
  renderItem?: (item: any) => React.ReactNode;
  emptyMessage: string;
  onAdd?: () => void;
  onRefresh?: () => void;
}

interface AdminLayoutProps {
  section: AdminSection;
  children?: React.ReactNode;
  renderItem?: (item: any) => React.ReactNode;
}

export default function AdminLayout({
  section,
  children,
  renderItem,
}: AdminLayoutProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredData = section.data.filter((item) => {
    // Apply search filter
    if (searchTerm) {
      const searchableFields = Object.values(item).join(" ").toLowerCase();
      if (!searchableFields.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    // Apply other filters
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "ALL" && item[key] !== value) {
        return false;
      }
    }

    return true;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {section.title}
            </h1>
            <p className="mt-2 text-gray-600">{section.description}</p>
          </div>
          {section.onAdd && (
            <button
              onClick={section.onAdd}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {section.stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {section.filters.map((filter) => (
            <div key={filter.key} className="flex-1">
              {filter.type === "search" ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${filter.label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filters[filter.key] || "ALL"}
                    onChange={(e) =>
                      handleFilterChange(filter.key, e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All {filter.label}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      {children || (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item, index) => (
            <div key={index}>
              {renderItem ? (
                renderItem(item)
              ) : section.renderItem ? (
                section.renderItem(item)
              ) : (
                <div>No render function available</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <section.icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No items found
          </h3>
          <p className="mt-1 text-sm text-gray-500">{section.emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

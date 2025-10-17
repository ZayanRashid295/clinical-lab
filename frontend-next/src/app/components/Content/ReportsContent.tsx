import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Users,
  Car,
  DollarSign,
  Clock,
  MapPin,
  RefreshCw,
} from "lucide-react";

// Mock data for reports
const MOCK_REPORTS = [
  {
    id: "1",
    name: "Revenue Report",
    description: "Monthly revenue analysis and trends",
    type: "FINANCIAL",
    category: "Revenue",
    lastGenerated: "2024-01-15T10:30:00Z",
    nextScheduled: "2024-02-15T10:30:00Z",
    status: "ACTIVE",
    format: "PDF",
    size: "2.4 MB",
    recordCount: 1250,
  },
  {
    id: "2",
    name: "Driver Performance",
    description: "Driver efficiency and performance metrics",
    type: "OPERATIONAL",
    category: "Performance",
    lastGenerated: "2024-01-14T16:45:00Z",
    nextScheduled: "2024-01-21T16:45:00Z",
    status: "ACTIVE",
    format: "EXCEL",
    size: "1.8 MB",
    recordCount: 156,
  },
  {
    id: "3",
    name: "Fleet Utilization",
    description: "Vehicle usage and utilization statistics",
    type: "OPERATIONAL",
    category: "Fleet",
    lastGenerated: "2024-01-13T09:15:00Z",
    nextScheduled: "2024-01-20T09:15:00Z",
    status: "ACTIVE",
    format: "CSV",
    size: "3.2 MB",
    recordCount: 89,
  },
  {
    id: "4",
    name: "Customer Satisfaction",
    description: "Customer feedback and satisfaction scores",
    type: "CUSTOMER",
    category: "Satisfaction",
    lastGenerated: "2024-01-12T14:20:00Z",
    nextScheduled: "2024-01-19T14:20:00Z",
    status: "ACTIVE",
    format: "PDF",
    size: "1.5 MB",
    recordCount: 2340,
  },
  {
    id: "5",
    name: "Maintenance Costs",
    description: "Vehicle maintenance and repair costs",
    type: "FINANCIAL",
    category: "Costs",
    lastGenerated: "2024-01-11T11:30:00Z",
    nextScheduled: "2024-01-18T11:30:00Z",
    status: "INACTIVE",
    format: "EXCEL",
    size: "2.1 MB",
    recordCount: 67,
  },
  {
    id: "6",
    name: "Route Analytics",
    description: "Route efficiency and optimization data",
    type: "OPERATIONAL",
    category: "Routes",
    lastGenerated: "2024-01-10T08:45:00Z",
    nextScheduled: "2024-01-17T08:45:00Z",
    status: "ACTIVE",
    format: "PDF",
    size: "4.7 MB",
    recordCount: 445,
  },
];

const REPORT_TYPES = {
  FINANCIAL: {
    label: "Financial",
    color: "bg-green-100 text-green-800",
    icon: DollarSign,
  },
  OPERATIONAL: {
    label: "Operational",
    color: "bg-blue-100 text-blue-800",
    icon: Car,
  },
  CUSTOMER: {
    label: "Customer",
    color: "bg-purple-100 text-purple-800",
    icon: Users,
  },
  COMPLIANCE: {
    label: "Compliance",
    color: "bg-yellow-100 text-yellow-800",
    icon: FileText,
  },
};

const REPORT_FORMATS = {
  PDF: { label: "PDF", color: "bg-red-100 text-red-800" },
  EXCEL: { label: "Excel", color: "bg-green-100 text-green-800" },
  CSV: { label: "CSV", color: "bg-blue-100 text-blue-800" },
  JSON: { label: "JSON", color: "bg-purple-100 text-purple-800" },
};

export default function ReportsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filteredReports, setFilteredReports] = useState(MOCK_REPORTS);
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    // Filter reports based on search term, type, and status
    let filtered = MOCK_REPORTS;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "ALL") {
      filtered = filtered.filter((report) => report.type === typeFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [searchTerm, typeFilter, statusFilter]);

  const getStatusIcon = (status: string) => {
    return status === "ACTIVE" ? (
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    );
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // Show success message
  };

  const totalReports = MOCK_REPORTS.length;
  const activeReports = MOCK_REPORTS.filter(
    (r) => r.status === "ACTIVE"
  ).length;
  const totalSize = MOCK_REPORTS.reduce((sum, report) => {
    const size = parseFloat(report.size.replace(" MB", ""));
    return sum + size;
  }, 0);
  const totalRecords = MOCK_REPORTS.reduce(
    (sum, report) => sum + report.recordCount,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-gray-600">
              Generate and manage system reports
            </p>
          </div>
          <button
            onClick={() => {
              /* Create custom report functionality */
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-5 w-5 mr-2" />
            Create Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Active Reports
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeReports}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalSize.toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRecords.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="FINANCIAL">Financial</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="CUSTOMER">Customer</option>
              <option value="COMPLIANCE">Compliance</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const TypeIcon =
            REPORT_TYPES[report.type as keyof typeof REPORT_TYPES]?.icon ||
            FileText;
          return (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold">{report.name}</h3>
                      <p className="text-sm opacity-90">{report.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.status)}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="p-6">
                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                  {report.description}
                </p>

                {/* Type and Format */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      REPORT_TYPES[report.type as keyof typeof REPORT_TYPES]
                        ?.color || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {REPORT_TYPES[report.type as keyof typeof REPORT_TYPES]
                      ?.label || report.type}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      REPORT_FORMATS[
                        report.format as keyof typeof REPORT_FORMATS
                      ]?.color || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {REPORT_FORMATS[
                      report.format as keyof typeof REPORT_FORMATS
                    ]?.label || report.format}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Size</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.size}
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Records</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {report.recordCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Last: {formatDate(report.lastGenerated)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Next: {formatDate(report.nextScheduled)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                  <button
                    onClick={() => {
                      /* View report details */
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reports found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first report."}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Quick Analytics
              </h3>
              <p className="text-sm text-gray-500">
                Generate instant analytics reports
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Scheduled Reports
              </h3>
              <p className="text-sm text-gray-500">
                Manage automated report generation
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Download className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-500">
                Export data in various formats
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

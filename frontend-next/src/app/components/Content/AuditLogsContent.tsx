import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Calendar,
  RefreshCw,
  Activity,
} from "lucide-react";

// Mock data for audit logs
const MOCK_AUDIT_LOGS = [
  {
    id: "1",
    userId: "user_123",
    userName: "John Smith",
    action: "LOGIN",
    resource: "Authentication",
    details: "User logged in successfully",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-01-15T10:30:00Z",
    status: "SUCCESS",
    severity: "INFO",
  },
  {
    id: "2",
    userId: "user_456",
    userName: "Sarah Johnson",
    action: "CREATE_USER",
    resource: "User Management",
    details: "Created new user account for mike.davis@company.com",
    ipAddress: "192.168.1.101",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    timestamp: "2024-01-15T09:45:00Z",
    status: "SUCCESS",
    severity: "INFO",
  },
  {
    id: "3",
    userId: "user_789",
    userName: "Mike Davis",
    action: "UPDATE_VEHICLE",
    resource: "Fleet Management",
    details: "Updated vehicle information for license plate ABC-123",
    ipAddress: "192.168.1.102",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
    timestamp: "2024-01-15T08:20:00Z",
    status: "SUCCESS",
    severity: "INFO",
  },
  {
    id: "4",
    userId: "user_123",
    userName: "John Smith",
    action: "DELETE_DRIVER",
    resource: "Driver Management",
    details: "Deleted driver account for inactive user",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-01-14T16:30:00Z",
    status: "SUCCESS",
    severity: "WARNING",
  },
  {
    id: "5",
    userId: "user_999",
    userName: "Unknown User",
    action: "FAILED_LOGIN",
    resource: "Authentication",
    details: "Failed login attempt with invalid credentials",
    ipAddress: "203.0.113.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-01-14T14:15:00Z",
    status: "FAILED",
    severity: "WARNING",
  },
  {
    id: "6",
    userId: "user_456",
    userName: "Sarah Johnson",
    action: "CHANGE_ROLE",
    resource: "Role Management",
    details: "Changed user role from DRIVER to FLEET_MANAGER",
    ipAddress: "192.168.1.101",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    timestamp: "2024-01-14T11:45:00Z",
    status: "SUCCESS",
    severity: "INFO",
  },
  {
    id: "7",
    userId: "user_123",
    userName: "John Smith",
    action: "SYSTEM_BACKUP",
    resource: "System",
    details: "Automated system backup completed successfully",
    ipAddress: "192.168.1.100",
    userAgent: "System/BackupService",
    timestamp: "2024-01-14T03:00:00Z",
    status: "SUCCESS",
    severity: "INFO",
  },
  {
    id: "8",
    userId: "user_789",
    userName: "Mike Davis",
    action: "ACCESS_DENIED",
    resource: "Admin Panel",
    details: "Attempted to access admin panel without proper permissions",
    ipAddress: "192.168.1.102",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
    timestamp: "2024-01-13T19:30:00Z",
    status: "FAILED",
    severity: "ERROR",
  },
];

const ACTION_TYPES = {
  LOGIN: { label: "Login", color: "bg-blue-100 text-blue-800", icon: User },
  CREATE_USER: {
    label: "Create User",
    color: "bg-green-100 text-green-800",
    icon: User,
  },
  UPDATE_VEHICLE: {
    label: "Update Vehicle",
    color: "bg-yellow-100 text-yellow-800",
    icon: Activity,
  },
  DELETE_DRIVER: {
    label: "Delete Driver",
    color: "bg-red-100 text-red-800",
    icon: User,
  },
  FAILED_LOGIN: {
    label: "Failed Login",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  CHANGE_ROLE: {
    label: "Change Role",
    color: "bg-purple-100 text-purple-800",
    icon: Shield,
  },
  SYSTEM_BACKUP: {
    label: "System Backup",
    color: "bg-gray-100 text-gray-800",
    icon: Activity,
  },
  ACCESS_DENIED: {
    label: "Access Denied",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

const SEVERITY_LEVELS = {
  INFO: { label: "Info", color: "bg-blue-100 text-blue-800", icon: Info },
  WARNING: {
    label: "Warning",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  ERROR: { label: "Error", color: "bg-red-100 text-red-800", icon: XCircle },
  CRITICAL: {
    label: "Critical",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

const STATUS_TYPES = {
  SUCCESS: {
    label: "Success",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
};

export default function AuditLogsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("7");
  const [filteredLogs, setFilteredLogs] = useState(MOCK_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Filter logs based on search term, action, severity, status, and date range
    let filtered = MOCK_AUDIT_LOGS;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ipAddress.includes(searchTerm)
      );
    }

    if (actionFilter !== "ALL") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    if (severityFilter !== "ALL") {
      filtered = filtered.filter((log) => log.severity === severityFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    // Filter by date range
    const days = parseInt(dateRange);
    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= cutoffDate
      );
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, severityFilter, statusFilter, dateRange]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log("Exporting audit logs...");
  };

  const totalLogs = MOCK_AUDIT_LOGS.length;
  const successLogs = MOCK_AUDIT_LOGS.filter(
    (l) => l.status === "SUCCESS"
  ).length;
  const failedLogs = MOCK_AUDIT_LOGS.filter(
    (l) => l.status === "FAILED"
  ).length;
  const warningLogs = MOCK_AUDIT_LOGS.filter(
    (l) => l.severity === "WARNING"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-2 text-gray-600">
              Monitor system activities and security events
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
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
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">{successLogs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{failedLogs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">{warningLogs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE_USER">Create User</option>
              <option value="UPDATE_VEHICLE">Update Vehicle</option>
              <option value="DELETE_DRIVER">Delete Driver</option>
              <option value="FAILED_LOGIN">Failed Login</option>
              <option value="CHANGE_ROLE">Change Role</option>
              <option value="SYSTEM_BACKUP">System Backup</option>
              <option value="ACCESS_DENIED">Access Denied</option>
            </select>
          </div>
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Severity</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="0">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const ActionIcon =
                  ACTION_TYPES[log.action as keyof typeof ACTION_TYPES]?.icon ||
                  Activity;
                const SeverityIcon =
                  SEVERITY_LEVELS[log.severity as keyof typeof SEVERITY_LEVELS]
                    ?.icon || Info;
                const StatusIcon =
                  STATUS_TYPES[log.status as keyof typeof STATUS_TYPES]?.icon ||
                  Info;

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <ActionIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ACTION_TYPES[
                              log.action as keyof typeof ACTION_TYPES
                            ]?.label || log.action}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.resource}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.ipAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_TYPES[log.status as keyof typeof STATUS_TYPES]
                            ?.color || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_TYPES[log.status as keyof typeof STATUS_TYPES]
                          ?.label || log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          SEVERITY_LEVELS[
                            log.severity as keyof typeof SEVERITY_LEVELS
                          ]?.color || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <SeverityIcon className="h-3 w-3 mr-1" />
                        {SEVERITY_LEVELS[
                          log.severity as keyof typeof SEVERITY_LEVELS
                        ]?.label || log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(log.timestamp)}</div>
                      <div className="text-xs">
                        {formatDateTime(log.timestamp).split(", ")[1]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          /* View log details */
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No audit logs found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ||
            actionFilter !== "ALL" ||
            severityFilter !== "ALL" ||
            statusFilter !== "ALL"
              ? "Try adjusting your search or filter criteria."
              : "No audit logs available for the selected time period."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">{filteredLogs.length}</span> of{" "}
            <span className="font-medium">{filteredLogs.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

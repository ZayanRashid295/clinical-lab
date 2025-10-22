import React from "react";
import { Eye, RefreshCw, Edit, Users, Mail, Phone, Shield } from "lucide-react";
import { User } from "../../types/user";

interface UsersTableProps {
  users: User[];
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
  onViewUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
  title?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onViewUser,
  onEditUser,
  title = "Users",
}) => {
  const getStatusColor = (isActive: boolean): string => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "FLEET_MANAGER":
        return "bg-blue-100 text-blue-800";
      case "DRIVER":
        return "bg-green-100 text-green-800";
      case "CUSTOMER_SUPPORT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getUserDisplayName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserRole = (user: User) => {
    // Get the first role or default to 'USER'
    return user.roles?.[0]?.role?.name || "USER";
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Users
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                    <span className="text-gray-500">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      No users found
                    </h3>
                    <p className="text-sm">
                      No users match your current filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar}
                            alt={getUserDisplayName(user)}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.phone || "No phone"}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        getUserRole(user)
                      )}`}
                    >
                      {getUserRole(user).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        user.isActive
                      )}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewUser?.(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => onEditUser?.(user)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                        title="Edit User"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;

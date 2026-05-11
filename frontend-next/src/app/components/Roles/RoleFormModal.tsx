import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Edit,
  Key,
} from "lucide-react";
import { Role, CreateRoleDto, UpdateRoleDto } from "../../types/user";
import { RolesService } from "../../services/roles/roles.service";
import { CreateResponse } from "../../services/base/api-types";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null; // Optional for create mode
  onRoleSaved: (role: Role) => void;
  mode: "create" | "edit";
}

const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: "User Management",
  ROLE_MANAGEMENT: "Role Management",
  SYSTEM_SETTINGS: "System Settings",
  FLEET_MANAGEMENT: "Fleet Management",
  DRIVER_MANAGEMENT: "Driver Management",
  VEHICLE_MANAGEMENT: "Vehicle Management",
  RIDE_MANAGEMENT: "Ride Management",
  PAYMENT_MANAGEMENT: "Payment Management",
  CUSTOMER_SUPPORT: "Customer Support",
  REPORT_ACCESS: "Report Access",
  AUDIT_ACCESS: "Audit Access",
  PROFILE_MANAGEMENT: "Profile Management",
  EARNING_ACCESS: "Earning Access",
  RIDE_VIEW: "Ride View",
  PAYMENT_VIEW: "Payment View",
  FINANCIAL_ANALYTICS: "Financial Analytics",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_CATEGORIES);

export default function RoleFormModal({
  isOpen,
  onClose,
  role,
  onRoleSaved,
  mode,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: "",
    displayName: "",
    description: "",
    permissions: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rolesService = new RolesService();
  const isCreateMode = mode === "create";

  // Reset form when modal opens/closes or role changes
  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        // Create mode - empty form
        setFormData({
          name: "",
          displayName: "",
          description: "",
          permissions: [],
          isActive: true,
        });
      } else if (role) {
        // Edit mode - pre-fill with role data
        setFormData({
          name: role.name || "",
          displayName: role.displayName || "",
          description: role.description || "",
          permissions: role.permissions || [],
          isActive: role.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, role, isCreateMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions || [];
      if (permissions.includes(permission)) {
        return {
          ...prev,
          permissions: permissions.filter((p) => p !== permission),
        };
      } else {
        return {
          ...prev,
          permissions: [...permissions, permission],
        };
      }
    });
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Role name is required";
    }
    if (!formData.displayName.trim()) {
      return "Display name is required";
    }
    if (!formData.description.trim()) {
      return "Description is required";
    }
    if (formData.permissions.length === 0) {
      return "At least one permission is required";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isCreateMode && !role) {
      setError("No role selected for editing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isCreateMode) {
        // Create new role
        const response = await rolesService.createRole(formData);
        // Handle union type: response is either CreateResponse or Role
        if ("name" in response && "displayName" in response) {
          // It's a Role
          onRoleSaved(response);
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        } else {
          // It's a CreateResponse, refetch the created entity
          const createResponse = response as CreateResponse;
          const savedRole = await rolesService.getRole(createResponse.id);
          onRoleSaved(savedRole);
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        }
      } else {
        // Update existing role
        const updateData: UpdateRoleDto = {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };
        const response = await rolesService.updateRole(role!.id, updateData);
        // Handle union type: response is either UpdateResponse or Role
        if ("name" in response && "displayName" in response) {
          // It's a Role
          onRoleSaved(response);
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        } else {
          // It's an UpdateResponse, refetch the updated entity
          const savedRole = await rolesService.getRole(role!.id);
          onRoleSaved(savedRole);
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        }
      }
    } catch (err) {
      console.error(
        `Error ${isCreateMode ? "creating" : "updating"} role:`,
        err
      );
      setError(
        getApiErrorMessage(
          err,
          `Failed to ${isCreateMode ? "create" : "update"} role. Please try again.`
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            {isCreateMode ? (
              <Plus className="h-6 w-6 text-green-600 mr-2" />
            ) : (
              <Edit className="h-6 w-6 text-blue-600 mr-2" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create New Role" : "Edit Role"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Role {isCreateMode ? "created" : "updated"} successfully!
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-blue-500 ${
                isCreateMode ? "focus:ring-green-500" : "focus:ring-blue-500"
              }`}
              placeholder="ADMIN"
              required
            />
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-blue-500 ${
                isCreateMode ? "focus:ring-green-500" : "focus:ring-blue-500"
              }`}
              placeholder="Administrator"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-blue-500 ${
                isCreateMode ? "focus:ring-green-500" : "focus:ring-blue-500"
              }`}
              placeholder="Role description..."
              required
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions * ({formData.permissions.length} selected)
            </label>
            <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {PERMISSION_CATEGORIES[
                        permission as keyof typeof PERMISSION_CATEGORIES
                      ] || permission}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="isActive"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="isActive"
              name="isActive"
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.value === "active",
                }))
              }
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-blue-500 ${
                isCreateMode ? "focus:ring-green-500" : "focus:ring-blue-500"
              }`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isCreateMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCreateMode ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Create Role" : "Update Role"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

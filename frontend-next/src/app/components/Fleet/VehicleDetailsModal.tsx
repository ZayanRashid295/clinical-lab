import React from "react";
import {
  X,
  Car,
  MapPin,
  Wrench,
  Fuel,
  Calendar,
  User,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Vehicle, VehicleStatus } from "../../types/fleet";

interface VehicleDetailsModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !vehicle) return null;

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
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        <IconComponent size={16} />
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

  const isMaintenanceDue = () => {
    const nextMaintenance = new Date(vehicle.nextMaintenance);
    const today = new Date();
    const daysUntilMaintenance = Math.ceil(
      (nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilMaintenance <= 7;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-gray-600">{vehicle.licensePlate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(vehicle.status)}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vehicle Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">VIN:</span>
                  <span className="font-mono text-gray-900">{vehicle.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span className="text-gray-900">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="text-gray-900">
                    {vehicle.mileage.toLocaleString()} mi
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Level:</span>
                  <div className="flex items-center gap-2">
                    <Fuel size={16} className="text-gray-400" />
                    <span className="text-gray-900">{vehicle.fuelLevel}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">
                    {formatDate(vehicle.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Location
              </h3>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span>{vehicle.location.address}</span>
              </div>
            </div>

            {/* Driver Assignment */}
            {vehicle.driverName && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Assigned Driver
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.driverName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Driver ID: {vehicle.driverId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Maintenance Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Maintenance:</span>
                  <span className="text-gray-900">
                    {formatDate(vehicle.lastMaintenance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Maintenance:</span>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span
                      className={`${
                        isMaintenanceDue()
                          ? "text-red-600 font-medium"
                          : "text-gray-900"
                      }`}
                    >
                      {formatDate(vehicle.nextMaintenance)}
                    </span>
                    {isMaintenanceDue() && (
                      <AlertTriangle size={16} className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Alert */}
            {isMaintenanceDue() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Maintenance Due Soon
                    </h4>
                    <p className="text-sm text-red-700">
                      This vehicle requires maintenance within the next 7 days.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Status:</span>
                  {getStatusBadge(vehicle.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900">
                    {formatDate(vehicle.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {vehicle.metadata && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h3>
                <div className="space-y-2">
                  {vehicle.metadata.fuelType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="text-gray-900">
                        {vehicle.metadata.fuelType}
                      </span>
                    </div>
                  )}
                  {vehicle.metadata.transmission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transmission:</span>
                      <span className="text-gray-900">
                        {vehicle.metadata.transmission}
                      </span>
                    </div>
                  )}
                  {vehicle.metadata.engineSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engine Size:</span>
                      <span className="text-gray-900">
                        {vehicle.metadata.engineSize}
                      </span>
                    </div>
                  )}
                  {vehicle.metadata.seatingCapacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seating Capacity:</span>
                      <span className="text-gray-900">
                        {vehicle.metadata.seatingCapacity}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(vehicle)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Edit size={16} />
              Edit Vehicle
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(vehicle)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors"
            >
              <Trash2 size={16} />
              Delete Vehicle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;

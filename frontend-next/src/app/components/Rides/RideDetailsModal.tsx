import React from "react";
import {
  X,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { Ride, RideStatus } from "../../types/ride";
import { toNumber } from "../../../utils/currency";

interface RideDetailsModalProps {
  ride: Ride | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (ride: Ride, status: RideStatus) => void;
}

const RideDetailsModal: React.FC<RideDetailsModalProps> = ({
  ride,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !ride) return null;

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

  const canUpdateStatus = !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
    ride.status
  );

  const statusOptions: RideStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "ARRIVING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Ride Details
                </h3>
                <span className="font-mono text-sm text-gray-500">
                  #{ride.id.slice(-8)}
                </span>
                {getStatusBadge(ride.status)}
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Trip Information */}
              <div className="space-y-6">
                {/* Route Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    Route Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Pickup
                      </p>
                      <p className="text-sm text-gray-900">
                        {ride.pickupAddress || "Unknown pickup location"}
                      </p>
                    </div>
                    <div className="border-l-2 border-gray-300 pl-4 ml-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Dropoff
                      </p>
                      <p className="text-sm text-gray-900">
                        {ride.dropoffAddress || "Unknown dropoff location"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    Trip Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Distance
                      </p>
                      <p className="text-sm text-gray-900">
                        {ride.distance
                          ? `${ride.distance.toFixed(1)} km`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Duration
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDuration(ride.duration)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={16} />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Fare Amount:
                      </span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(toNumber(ride.fare))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - People Information */}
              <div className="space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User size={16} />
                    User Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {ride.passengerName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ride.passengerName || "Unknown User"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Timestamps
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Created
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(ride.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Last Updated
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(ride.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetailsModal;

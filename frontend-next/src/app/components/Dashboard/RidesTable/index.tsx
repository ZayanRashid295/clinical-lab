import React from "react";
import { Ride } from "../../../types/ride";
import { Column, Action } from "../../../types/ui";
import DataTable from "../DataTable";

interface RidesTableProps {
  rides: Ride[];
  title?: string;
  loading?: boolean;
  onViewRide?: (ride: Ride) => void;
  onTrackRide?: (ride: Ride) => void;
  onMessageRide?: (ride: Ride) => void;
}

const RidesTable: React.FC<RidesTableProps> = ({
  rides,
  title = "Recent Rides",
  loading = false,
  onViewRide,
  onTrackRide,
  onMessageRide,
}) => {
  const getStatusBadge = (status: Ride["status"]) => {
    const statusConfig = {
      REQUESTED: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-blue-100 text-blue-800",
      ARRIVING: "bg-purple-100 text-purple-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      NO_SHOW: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const columns: Column<Ride>[] = [
    { key: "passengerName", label: "Passenger" },
    { key: "driverName", label: "Driver" },
    {
      key: "status",
      label: "Status",
      render: (status: Ride["status"]) => getStatusBadge(status),
    },
    {
      key: "pickupAddress",
      label: "Route",
      render: (pickup: string, row?: Ride) =>
        row ? `${pickup} → ${row.dropoffAddress}` : pickup,
    },
    {
      key: "fare",
      label: "Fare",
      render: (fare: number | string) =>
        `$${
          typeof fare === "string" ? Number(fare).toFixed(2) : fare.toFixed(2)
        }`,
    },
  ];

  const actions: Action<Ride>[] = [
    {
      label: "View",
      onClick: onViewRide || ((ride) => console.log("View ride", ride)),
      className: "text-blue-600 hover:text-blue-800",
    },
    {
      label: "Track",
      onClick: onTrackRide || ((ride) => console.log("Track ride", ride)),
      className: "text-green-600 hover:text-green-800",
      disabled: (ride) =>
        ride.status === "COMPLETED" ||
        ride.status === "CANCELLED" ||
        ride.status === "NO_SHOW",
    },
    {
      label: "Message",
      onClick: onMessageRide || ((ride) => console.log("Message", ride)),
      className: "text-purple-600 hover:text-purple-800",
    },
  ];

  return (
    <DataTable
      data={rides}
      columns={columns}
      actions={actions}
      title={title}
      loading={loading}
      emptyMessage="No rides found"
    />
  );
};

export default RidesTable;

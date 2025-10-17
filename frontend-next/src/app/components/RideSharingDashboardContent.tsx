import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ConfirmDialog, FormModal, Button } from "../../shared";
import StatsCards from "./Dashboard/StatsCards";
import AlertsPanel from "./Dashboard/AlertsPanel";
import RidesTable from "./Dashboard/RidesTable";
import { MOCK_STATS, MOCK_ALERTS } from "../../data/mockData";
import { Ride } from "../types/ride";
import { Alert } from "../types/ui";
import { typography, spacing } from "../../shared/utils/responsive";
import useRides from "../../hooks/useRides";
import RideDetailsModal from "./Rides/RideDetailsModal";

const RideSharingDashboardContent: React.FC = () => {
  const [isNewRideModalOpen, setIsNewRideModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showRideModal, setShowRideModal] = useState(false);

  // Use the rides hook to get real data
  const { rides, loading, error, refetch } = useRides({
    limit: 5, // Show only 5 recent rides on dashboard
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleQuickAction = () => {
    setIsNewRideModalOpen(true);
  };

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleViewRide = (ride: Ride) => {
    setSelectedRide(ride);
    setShowRideModal(true);
  };

  const handleTrackRide = (ride: Ride) => {
    console.log("Track ride:", ride);
  };

  const handleMessageRide = (ride: Ride) => {
    setIsConfirmDialogOpen(true);
  };

  const handleCloseRideModal = () => {
    setShowRideModal(false);
    setSelectedRide(null);
  };

  const handleRideRequestSuccess = (newRide: Ride) => {
    console.log("Ride request created successfully:", newRide);
    setIsNewRideModalOpen(false);
    // Refresh the rides list
    refetch();
  };

  return (
    <div className={spacing.stack.lg}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2
          className={`${typography.heading[1]} text-gray-900 dark:text-white`}
        >
          Uber Dashboard
        </h2>
        <Button
          onClick={handleQuickAction}
          variant="primary"
          size="md"
          className="self-start sm:self-auto"
        >
          <Plus size={16} />
          <span className="whitespace-nowrap">New Ride Request</span>
        </Button>
      </div>

      {/* Dashboard Statistics */}
      <StatsCards
        stats={
          loading
            ? MOCK_STATS
            : [
                {
                  id: "total-rides",
                  label: "Total Rides",
                  value: rides.length,
                  icon: () => <span className="text-blue-600">🚗</span>,
                  color: "text-blue-600",
                  bgColor: "bg-white dark:bg-gray-800",
                  textColor: "text-gray-900 dark:text-white",
                },
                {
                  id: "active-rides",
                  label: "Active Rides",
                  value: rides.filter((r) =>
                    ["ACCEPTED", "ARRIVING", "IN_PROGRESS"].includes(r.status)
                  ).length,
                  icon: () => <span className="text-green-600">⚡</span>,
                  color: "text-green-600",
                  bgColor: "bg-white dark:bg-gray-800",
                  textColor: "text-green-600 dark:text-green-400",
                },
                {
                  id: "completed-today",
                  label: "Completed Today",
                  value: rides.filter((r) => {
                    const today = new Date().toDateString();
                    return (
                      r.status === "COMPLETED" &&
                      new Date(r.createdAt).toDateString() === today
                    );
                  }).length,
                  icon: () => <span className="text-purple-600">✓</span>,
                  color: "text-purple-600",
                  bgColor: "bg-white dark:bg-gray-800",
                  textColor: "text-purple-600 dark:text-purple-400",
                },
                {
                  id: "revenue-today",
                  label: "Today's Revenue",
                  value: `$${rides
                    .filter((r) => {
                      const today = new Date().toDateString();
                      return (
                        r.status === "COMPLETED" &&
                        new Date(r.createdAt).toDateString() === today
                      );
                    })
                    .reduce(
                      (sum, r) =>
                        sum + (typeof r.fare === "number" ? r.fare : 0),
                      0
                    )
                    .toFixed(2)}`,
                  icon: () => <span className="text-yellow-600">💰</span>,
                  color: "text-yellow-600",
                  bgColor: "bg-white dark:bg-gray-800",
                  textColor: "text-yellow-600 dark:text-yellow-400",
                },
              ]
        }
      />

      {/* Recent Alerts */}
      <AlertsPanel alerts={MOCK_ALERTS} onViewDetails={handleViewAlert} />

      {/* Recent Rides Table */}
      <RidesTable
        rides={rides}
        loading={loading}
        onViewRide={handleViewRide}
        onTrackRide={handleTrackRide}
        onMessageRide={handleMessageRide}
        title="Recent Rides"
      />

      {/* Ride Request Modal */}
      <Modal
        isOpen={isNewRideModalOpen}
        onClose={() => setIsNewRideModalOpen(false)}
        title="Request New Ride"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600">Ride request form would go here</p>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setIsNewRideModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Create a mock ride for the handler
                const mockRide: Ride = {
                  id: "mock-" + Date.now(),
                  passengerId: "mock-passenger",
                  status: "REQUESTED",
                  fare: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                handleRideRequestSuccess(mockRide);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Request Ride
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        title="Alert Details"
        size="md"
      >
        {selectedAlert && (
          <div className={spacing.component.md}>
            <div className={spacing.stack.sm}>
              <div>
                <h4 className={`${typography.heading[5]} text-gray-900`}>
                  Passenger
                </h4>
                <p className={typography.body.regular}>
                  {selectedAlert.passenger}
                </p>
              </div>
              <div>
                <h4 className={`${typography.heading[5]} text-gray-900`}>
                  Alert Type
                </h4>
                <p className={typography.body.regular}>{selectedAlert.type}</p>
              </div>
              <div>
                <h4 className={`${typography.heading[5]} text-gray-900`}>
                  Message
                </h4>
                <p className={typography.body.regular}>
                  {selectedAlert.message}
                </p>
              </div>
              <div>
                <h4 className={`${typography.heading[5]} text-gray-900`}>
                  Time
                </h4>
                <p className={typography.body.regular}>{selectedAlert.time}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          console.log("Message sent");
          setIsConfirmDialogOpen(false);
        }}
        title="Send Message"
        message="Do you want to send a message to this passenger?"
        confirmText="Send Message"
        variant="info"
      />

      {/* Ride Details Modal */}
      <RideDetailsModal
        ride={selectedRide}
        isOpen={showRideModal}
        onClose={handleCloseRideModal}
      />
    </div>
  );
};

export default RideSharingDashboardContent;

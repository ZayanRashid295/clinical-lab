import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Car,
  CreditCard,
  Gift,
  Clock,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { Notification } from "../../types/chat";
import { MOCK_NOTIFICATIONS } from "../../../data/mockData";

interface NotificationsListProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  onNotificationClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showRead, setShowRead] = useState(true);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "RIDE_UPDATE":
        return <Car size={16} className="text-blue-600" />;
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return <CreditCard size={16} className="text-green-600" />;
      case "PROMOTION":
        return <Gift size={16} className="text-purple-600" />;
      case "RIDE_REMINDER":
        return <Clock size={16} className="text-orange-600" />;
      case "ALERT":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Info size={16} className="text-gray-600" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "RIDE_UPDATE":
        return "bg-blue-100 text-blue-800";
      case "PAYMENT_SUCCESS":
        return "bg-green-100 text-green-800";
      case "PAYMENT_FAILED":
        return "bg-red-100 text-red-800";
      case "PROMOTION":
        return "bg-purple-100 text-purple-800";
      case "RIDE_REMINDER":
        return "bg-orange-100 text-orange-800";
      case "ALERT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = MOCK_NOTIFICATIONS.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "ALL" || notification.type === filterType;
    const matchesReadFilter = showRead || !notification.isRead;
    return matchesSearch && matchesFilter && matchesReadFilter;
  });

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (notification: Notification) => {
    // TODO: Implement mark as read functionality
  };

  const handleMarkAllAsRead = () => {
    // TODO: Implement mark all as read functionality
  };

  const handleDeleteNotification = (notification: Notification) => {
    // TODO: Implement delete functionality
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "ALL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("RIDE_UPDATE")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "RIDE_UPDATE"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Rides
            </button>
            <button
              onClick={() => setFilterType("PAYMENT_SUCCESS")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "PAYMENT_SUCCESS"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setFilterType("PROMOTION")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "PROMOTION"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Promotions
            </button>
            <button
              onClick={() => setShowRead(!showRead)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                showRead
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {showRead ? "Show All" : "Unread Only"}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bell size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No notifications found</h3>
            <p className="text-sm text-center">
              {searchTerm || filterType !== "ALL" || !showRead
                ? "Try adjusting your search or filter"
                : "You're all caught up! New notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick?.(notification)}
                className={`p-4 rounded-lg cursor-pointer transition-colors mb-2 border ${
                  notification.isRead
                    ? "bg-white border-gray-200 hover:bg-gray-50"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getNotificationTypeColor(
                          notification.type
                        )}`}
                      >
                        {notification.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {notification.message}
                    </p>

                    {notification.data && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(notification.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;

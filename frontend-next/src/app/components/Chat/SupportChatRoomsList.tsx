import React, { useState } from "react";
import {
  MessageCircle,
  Users,
  Headphones,
  Clock,
  MoreVertical,
  Search,
  Filter,
  Plus,
  Image as ImageIcon,
  File,
  MapPin,
} from "lucide-react";
import { ChatRoom, ChatType } from "../../types/chat";
import { MOCK_CHAT_ROOMS } from "../../../data/mockData";

interface SupportChatRoomsListProps {
  onRoomSelect?: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

const SupportChatRoomsList: React.FC<SupportChatRoomsListProps> = ({
  onRoomSelect,
  selectedRoomId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ChatType | "ALL">("SUPPORT");

  // Filter to only show support-related chat rooms
  const supportRooms = MOCK_CHAT_ROOMS.filter(
    (room) =>
      room.type === "SUPPORT" ||
      room.title.toLowerCase().includes("support") ||
      room.participants.some((participantId: string) => {
        // Check if any participant is a support user
        return participantId === "4"; // Support user ID from mock data
      })
  );

  const getRoomIcon = (type: ChatType) => {
    switch (type) {
      case "RIDE":
        return <MessageCircle size={16} className="text-blue-600" />;
      case "SUPPORT":
        return <Headphones size={16} className="text-green-600" />;
      case "GENERAL":
        return <Users size={16} className="text-purple-600" />;
      default:
        return <MessageCircle size={16} className="text-gray-600" />;
    }
  };

  const getRoomTypeColor = (type: ChatType) => {
    switch (type) {
      case "RIDE":
        return "bg-blue-100 text-blue-800";
      case "SUPPORT":
        return "bg-green-100 text-green-800";
      case "GENERAL":
        return "bg-purple-100 text-purple-800";
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
    return date.toLocaleDateString();
  };

  const getRichContentPreview = (message: any) => {
    if (!message) return "";

    switch (message.type) {
      case "IMAGE":
        return (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <ImageIcon size={12} />
            Photo
          </span>
        );
      case "FILE":
        return (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <File size={12} />
            {message.metadata?.fileName || "File"}
          </span>
        );
      case "LOCATION":
        return (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <MapPin size={12} />
            Location
          </span>
        );
      default:
        return message.content;
    }
  };

  const filteredRooms = supportRooms.filter((room) => {
    const matchesSearch = room.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "ALL" || room.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = supportRooms.reduce(
    (total, room) => total + room.unreadCount,
    0
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Support Chats
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Plus size={20} />
          </button>
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
              placeholder="Search support chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "ALL"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Support
            </button>
            <button
              onClick={() => setFilterType("SUPPORT")}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === "SUPPORT"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Support Only
            </button>
          </div>
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Headphones size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No support chats found</h3>
            <p className="text-sm text-center">
              {searchTerm || filterType !== "ALL"
                ? "Try adjusting your search or filter"
                : "No support conversations yet. Contact support to start a chat."}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onRoomSelect?.(room)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedRoomId === room.id
                    ? "bg-green-50 border border-green-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                    {getRoomIcon(room.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {room.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {room.unreadCount > 0 && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                            {room.unreadCount}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatTime(room.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getRoomTypeColor(
                          room.type
                        )}`}
                      >
                        {room.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {room.participants.length} participant
                        {room.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {room.lastMessage && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate">
                          <strong>{room.lastMessage.sender?.name}:</strong>{" "}
                          {getRichContentPreview(room.lastMessage)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChatRoomsList;

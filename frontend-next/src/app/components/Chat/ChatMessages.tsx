import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  User,
  MessageCircle,
  Image as ImageIcon,
  File,
  MapPin,
  Download,
  ExternalLink,
} from "lucide-react";
import { ChatRoom, Message } from "../../types/chat";
import { MOCK_MESSAGES } from "../../../data/mockData";

interface ChatMessagesProps {
  room: ChatRoom | null;
  onBack?: () => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ room, onBack }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for the current room
  const roomMessages = room
    ? MOCK_MESSAGES.filter((msg) => msg.chatRoomId === room.id)
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !room) return;

    // Simulate sending message
    console.log("Sending message:", newMessage);
    setNewMessage("");
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon size={16} className="text-blue-500" />;
      case "FILE":
        return <File size={16} className="text-green-500" />;
      case "LOCATION":
        return <MapPin size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const renderRichContent = (message: Message) => {
    switch (message.type) {
      case "IMAGE":
        return (
          <div className="space-y-2">
            <div className="relative group">
              <img
                src={message.content}
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Image not available</p>
                </div>
              </div>
              <button
                onClick={() => window.open(message.content, "_blank")}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink size={14} />
              </button>
            </div>
            {message.metadata?.fileName && (
              <p className="text-xs text-gray-500 truncate">
                {message.metadata.fileName}
              </p>
            )}
          </div>
        );

      case "FILE":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <File size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {message.metadata?.fileName || "Unknown file"}
                </p>
                {message.metadata?.fileSize && (
                  <p className="text-xs text-gray-500">
                    {(message.metadata.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  // In a real app, this would trigger a download
                  console.log("Download file:", message.content);
                }}
                className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        );

      case "LOCATION":
        return (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <MapPin size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Shared Location
                  </p>
                  {message.metadata?.location?.address && (
                    <p className="text-sm text-gray-600 mb-2">
                      {message.metadata.location.address}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (message.metadata?.location) {
                        const { latitude, longitude } =
                          message.metadata.location;
                        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                        window.open(mapsUrl, "_blank");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open in Maps
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a chat room
          </h3>
          <p className="text-gray-500">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
            <User size={20} className="text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {room.title}
            </h3>
            <p className="text-sm text-gray-500">
              {room.participants.length} participant
              {room.participants.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Video size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {roomMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          roomMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === "1" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === "1"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getMessageTypeIcon(message.type)}
                  <span className="text-xs opacity-75">
                    {message.sender?.name}
                  </span>
                </div>
                <div
                  className={`${
                    message.type !== "TEXT" ? "text-gray-900" : ""
                  }`}
                >
                  {renderRichContent(message)}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === "1" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile size={16} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>

        {isTyping && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="inline-block animate-pulse">Typing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;

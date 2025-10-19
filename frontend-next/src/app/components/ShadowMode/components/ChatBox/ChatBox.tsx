import React from "react";
import { MessageSquare } from "lucide-react";

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

interface ChatBoxProps {
  messages: Message[];
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <MessageSquare className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-bold text-gray-800">Chat</h3>
      </div>

      <div className="bg-gray-50 rounded p-2 flex-1 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <p className="text-gray-400 italic text-center">No messages...</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.sender === "doctor" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-xs px-2 py-1 rounded ${
                  msg.sender === "doctor"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-green-100 text-green-900"
                }`}
              >
                <p className="font-semibold text-xs">
                  {msg.sender === "doctor" ? "👨‍⚕️" : "🤒"}
                </p>
                <p className="text-xs">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatBox;

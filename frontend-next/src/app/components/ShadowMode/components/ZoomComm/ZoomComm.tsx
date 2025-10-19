import React, { useState } from "react";
import { Video } from "lucide-react";

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

interface ZoomCommProps {
  onSendMessage: (message: Message) => void;
  onOrderLabs: (labTypes: string[]) => void;
}

const ZoomComm: React.FC<ZoomCommProps> = ({ onSendMessage, onOrderLabs }) => {
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("patient");
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage({
        sender,
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      });
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleLabToggle = (labType: string) => {
    setSelectedLabs((prev) =>
      prev.includes(labType)
        ? prev.filter((lab) => lab !== labType)
        : [...prev, labType]
    );
  };

  const handleOrderLabs = () => {
    if (selectedLabs.length > 0) {
      onOrderLabs(selectedLabs);
      setSelectedLabs([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <Video className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-800">Zoom</h3>
      </div>

      {/* Lab Ordering Section */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-700 mb-1">
          Order Labs:
        </div>
        <div className="grid grid-cols-2 gap-1 mb-2">
          {["urine", "blood", "LDL", "HDL"].map((labType) => (
            <button
              key={labType}
              onClick={() => handleLabToggle(labType)}
              className={`px-2 py-1 rounded text-xs ${
                selectedLabs.includes(labType)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {labType.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={handleOrderLabs}
          disabled={selectedLabs.length === 0}
          className={`w-full px-2 py-1 rounded text-xs ${
            selectedLabs.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Order Labs ({selectedLabs.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-blue-100 rounded p-2 flex items-center justify-center">
          <span className="text-xl">👨‍⚕️</span>
        </div>
        <div className="bg-green-100 rounded p-2 flex items-center justify-center">
          <span className="text-xl">🤒</span>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex gap-1">
          <button
            onClick={() => setSender("doctor")}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              sender === "doctor" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Doctor
          </button>
          <button
            onClick={() => setSender("patient")}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              sender === "patient" ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            Patient
          </button>
        </div>

        <div className="flex gap-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`As ${sender}...`}
            className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoomComm;

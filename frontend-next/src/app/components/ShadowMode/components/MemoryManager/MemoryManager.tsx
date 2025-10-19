import React from "react";
import { Database } from "lucide-react";

interface TimelineStep {
  chat: Array<{
    sender: string;
    text: string;
    timestamp: string;
  }>;
  thoughts: string[];
  diagnoses: Array<{
    name: string;
    percentage: number;
  }>;
  labResults: Array<{
    id: string;
    orderedAt: string;
    tests: Array<{
      type: "urine" | "blood" | "LDL" | "HDL";
      status: "pending" | "completed";
      results?: any;
    }>;
  }>;
  stats: {
    totalMessages: number;
    patientMessages: number;
    doctorMessages: number;
    doctorThoughts: number;
    activeDiagnoses: number;
  };
}

interface MemoryManagerProps {
  data: TimelineStep[];
}

const MemoryManager: React.FC<MemoryManagerProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <Database className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-bold text-gray-800">Memory</h3>
      </div>

      <div className="bg-gray-900 text-green-400 rounded p-2 flex-1 overflow-y-auto overflow-x-auto font-mono text-xs min-h-0">
        <pre className="text-xs whitespace-pre-wrap break-words min-w-0">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MemoryManager;

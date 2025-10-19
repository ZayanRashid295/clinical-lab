import React from "react";
import { Brain } from "lucide-react";

interface DoctorsThoughtsProps {
  thoughts: string[];
}

const DoctorsThoughts: React.FC<DoctorsThoughtsProps> = ({ thoughts }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <Brain className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-gray-800">Thoughts</h3>
      </div>

      <div className="bg-indigo-50 rounded p-2 flex-1 overflow-y-auto">
        {thoughts.length === 0 ? (
          <p className="text-gray-400 italic text-xs">No thoughts...</p>
        ) : (
          <ul className="space-y-1">
            {thoughts.map((thought, idx) => (
              <li
                key={idx}
                className="bg-white p-2 rounded text-xs border-l-2 border-indigo-500"
              >
                <span className="text-xs text-gray-500">#{idx + 1}</span>
                <p className="text-xs mt-1">{thought}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DoctorsThoughts;

import React from "react";
import { BarChart3 } from "lucide-react";

interface Diagnosis {
  name: string;
  percentage: number;
}

interface DiffDiagProps {
  diagnoses: Diagnosis[];
}

const DiffDiag: React.FC<DiffDiagProps> = ({ diagnoses }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <BarChart3 className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-bold text-gray-800">Diagnosis</h3>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {diagnoses.length === 0 ? (
          <p className="text-gray-400 italic text-xs">No diagnoses...</p>
        ) : (
          diagnoses.map((diag, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs">{diag.name}</span>
                <span className="text-xs font-bold text-red-600">
                  {diag.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${diag.percentage}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiffDiag;

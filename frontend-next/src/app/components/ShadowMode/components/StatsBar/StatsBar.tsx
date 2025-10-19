import React from "react";
import { BarChart3 } from "lucide-react";

interface Stats {
  totalMessages: number;
  patientMessages: number;
  doctorMessages: number;
  doctorThoughts: number;
  activeDiagnoses: number;
}

interface StatsBarProps {
  stats: Stats;
}

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="flex items-center gap-1 mb-2">
        <BarChart3 className="w-4 h-4 text-orange-600" />
        <h3 className="text-sm font-bold text-gray-800">Stats</h3>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-blue-600">
            {stats.totalMessages}
          </p>
          <p className="text-xs text-gray-600">Messages</p>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-green-600">
            {stats.patientMessages}
          </p>
          <p className="text-xs text-gray-600">Patient</p>
        </div>
        <div className="bg-purple-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-purple-600">
            {stats.doctorMessages}
          </p>
          <p className="text-xs text-gray-600">Doctor</p>
        </div>
        <div className="bg-indigo-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-indigo-600">
            {stats.doctorThoughts}
          </p>
          <p className="text-xs text-gray-600">Thoughts</p>
        </div>
        <div className="bg-red-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-red-600">
            {stats.activeDiagnoses}
          </p>
          <p className="text-xs text-gray-600">Diagnoses</p>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;

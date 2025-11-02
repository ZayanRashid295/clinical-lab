import React from "react";
import { MenuItem } from "../../../../types/menu";

interface JSONOutputProps {
  items: MenuItem[];
}

export const JSONOutput: React.FC<JSONOutputProps> = ({ items }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">
        JSON Output:
      </h3>
      <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-auto max-h-64 text-gray-700 font-mono">
        {JSON.stringify({ items }, null, 2)}
      </pre>
    </div>
  );
};

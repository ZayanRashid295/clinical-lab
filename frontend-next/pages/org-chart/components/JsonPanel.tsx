import React from "react";
import { OrgChartData } from "@/app/components/OrgChart/org-chart-types/org-chart-model";

interface JsonPanelProps {
  showJsonPanel: boolean;
  jsonPanelWidth: number;
  data: OrgChartData;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const JsonPanel: React.FC<JsonPanelProps> = ({
  showJsonPanel,
  jsonPanelWidth,
  data,
  onResizeStart,
}) => {
  return (
    <>
      {showJsonPanel && (
        <div
          className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize flex-shrink-0 relative group"
          onMouseDown={onResizeStart}
          style={{ cursor: "col-resize" }}
        >
          <div className="absolute inset-0 w-full h-full" />
        </div>
      )}

      <div
        className={`bg-gray-950 border-l border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
          showJsonPanel ? "opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
        style={
          showJsonPanel ? { width: `${jsonPanelWidth}px` } : { width: "0px" }
        }
      >
        {showJsonPanel && (
          <>
            <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-white">
                JSON Configuration
              </h3>
            </div>
            <pre className="flex-1 bg-gray-900 text-green-400 p-3 overflow-auto text-xs font-mono custom-scrollbar">
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}
      </div>
    </>
  );
};

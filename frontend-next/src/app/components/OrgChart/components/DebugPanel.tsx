import React from "react";
import { DebugLogEntry } from "../hooks/useOrgChartDrag";

interface DebugPanelProps {
  showDebugPanel: boolean;
  debugPanelWidth: number;
  debugLog: DebugLogEntry[];
  onClearLog: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  showDebugPanel,
  debugPanelWidth,
  debugLog,
  onClearLog,
  onResizeStart,
}) => {
  return (
    <>
      {showDebugPanel && (
        <div
          className="w-1 bg-gray-700 hover:bg-purple-600 cursor-col-resize flex-shrink-0 relative group"
          onMouseDown={onResizeStart}
          style={{ cursor: "col-resize" }}
        >
          <div className="absolute inset-0 w-full h-full" />
        </div>
      )}

      <div
        className={`bg-gray-950 border-l border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
          showDebugPanel ? "opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
        style={
          showDebugPanel ? { width: `${debugPanelWidth}px` } : { width: "0px" }
        }
      >
        {showDebugPanel && (
          <>
            <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-bold text-white">Debug Log</h3>
              <button
                onClick={onClearLog}
                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                title="Clear debug log"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 bg-gray-900 text-gray-300 p-3 overflow-auto text-xs font-mono custom-scrollbar">
              {debugLog.length === 0 ? (
                <div className="text-gray-500 italic">
                  No debug entries yet. Drag and drop nodes to see debug info.
                </div>
              ) : (
                <div className="space-y-4">
                  {debugLog.map((entry, index) => {
                    let sideStripColor = "";
                    let typeLabel = "";
                    let typeColor = "";
                    if (entry.type === "drag-start") {
                      sideStripColor = "bg-blue-500";
                      typeLabel = "DRAG START";
                      typeColor = "text-blue-400";
                    } else if (entry.type === "snap") {
                      sideStripColor = "bg-gray-400";
                      typeLabel = "SNAP";
                      typeColor = "text-gray-400";
                    } else if (entry.type === "release") {
                      sideStripColor = "bg-green-500";
                      typeLabel = "RELEASE";
                      typeColor = "text-green-400";
                    }

                    return (
                      <div
                        key={index}
                        className="border border-gray-700 rounded p-3 bg-gray-800 relative overflow-hidden"
                      >
                        {sideStripColor && (
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${sideStripColor}`}
                          />
                        )}
                        <div className="ml-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${typeColor} font-bold text-sm`}>
                              [{entry.timestamp}] {typeLabel}
                            </span>
                          </div>
                          <div className="space-y-1 mb-3">
                            {entry.sourceNode && (
                              <div>
                                <span className="text-blue-400">Source:</span>{" "}
                                <span className="text-white">{entry.sourceNode}</span>
                              </div>
                            )}
                            {entry.destinationNode && (
                              <div>
                                <span className="text-green-400">Destination:</span>{" "}
                                <span className="text-white">
                                  {entry.destinationNode}
                                </span>
                              </div>
                            )}
                            {entry.position && (
                              <div>
                                <span className="text-yellow-400">Position:</span>{" "}
                                <span className="text-white font-bold">
                                  {entry.position}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};


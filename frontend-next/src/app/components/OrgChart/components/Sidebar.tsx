import React from "react";
import { FlatNode } from "@/app/components/OrgChart/org-chart-types/org-chart-model";

interface SidebarProps {
  showSidebar: boolean;
  flatNodes: FlatNode[];
  positions: Map<string, { x: number; y: number }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  showSidebar,
  flatNodes,
  positions,
}) => {
  return (
    <div
      className={`bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
        showSidebar ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
      }`}
    >
      {showSidebar && (
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Organization
          </h3>
          <div className="space-y-2">
            {flatNodes.map((node) => {
              const pos = positions.get(node.id);
              return (
                <div
                  key={node.id}
                  className="p-2 bg-gray-800 rounded text-xs text-gray-400 hover:bg-gray-700 transition-colors"
                >
                  <div className="font-semibold text-white">{node.role}</div>
                  <div className="text-gray-400">{node.name}</div>
                  {pos && (
                    <div className="text-gray-500 mt-1">Level {node.level}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { FlatNode } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { NODE_WIDTH, NODE_HEIGHT } from "../constants";
import { getNodeColor } from "../utils/color-utils";
import { DropPosition } from "../hooks/useOrgChartDrag";

interface OrgChartNodeProps {
  node: FlatNode;
  position: { x: number; y: number };
  isDragging: boolean;
  isDragOver: boolean;
  isReleased: boolean;
  dragOverPosition: DropPosition;
  draggingNodeId: string | null;
  editingNode: { nodeId: string; field: "role" | "name" } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  onDragStart: (e: React.DragEvent, nodeId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, nodeId: string) => void;
  onDrop: (e: React.DragEvent, nodeId: string) => void;
  onStartEdit: (
    nodeId: string,
    field: "role" | "name",
    currentValue: string
  ) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const OrgChartNode: React.FC<OrgChartNodeProps> = ({
  node,
  position,
  isDragging,
  isDragOver,
  isReleased,
  dragOverPosition,
  draggingNodeId,
  editingNode,
  editValue,
  setEditValue,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) => {
  const nodeColor = getNodeColor(node.id);
  const { x, y } = position;

  const canDropAsChild = isDragOver && dragOverPosition === "center";
  const canDropAsSibling =
    isDragOver &&
    (dragOverPosition === "top" ||
      dragOverPosition === "bottom" ||
      dragOverPosition === "left" ||
      dragOverPosition === "right");

  // Determine side strip color
  let sideStripColor = "";
  if (isDragging) {
    sideStripColor = "bg-blue-500";
  } else if (isDragOver) {
    sideStripColor = "bg-gray-400";
  } else if (isReleased) {
    sideStripColor = "bg-green-500";
  }

  return (
    <div key={node.id}>
      {/* Drop zone indicators */}
      {isDragOver &&
        dragOverPosition === "top" &&
        draggingNodeId !== node.id && (
          <div
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y - 10}px`,
              width: `${NODE_WIDTH}px`,
              height: "4px",
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          />
        )}

      {isDragOver &&
        dragOverPosition === "left" &&
        draggingNodeId !== node.id && (
          <div
            style={{
              position: "absolute",
              left: `${x - 10}px`,
              top: `${y}px`,
              width: "4px",
              height: `${NODE_HEIGHT}px`,
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          />
        )}

      {isDragOver &&
        dragOverPosition === "right" &&
        draggingNodeId !== node.id && (
          <div
            style={{
              position: "absolute",
              left: `${x + NODE_WIDTH + 6}px`,
              top: `${y}px`,
              width: "4px",
              height: `${NODE_HEIGHT}px`,
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          />
        )}

      {/* Node */}
      <div
        draggable={editingNode?.nodeId !== node.id}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", node.id);
          onDragStart(e, node.id);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEnd();
        }}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDrop={(e) => {
          if (draggingNodeId && draggingNodeId !== node.id) {
            onDrop(e, node.id);
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${NODE_WIDTH}px`,
          height: `${NODE_HEIGHT}px`,
          opacity: isDragging ? 0.5 : 1,
          cursor:
            editingNode?.nodeId === node.id
              ? "text"
              : isDragging
              ? "grabbing"
              : "grab",
          zIndex: isDragging ? 1000 : "auto",
        }}
        className={`rounded-lg shadow-xl border-2 overflow-hidden transition-all relative ${
          canDropAsChild
            ? "border-blue-500 ring-4 ring-blue-300"
            : canDropAsSibling
            ? "border-blue-400"
            : isDragOver
            ? "border-blue-300"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        {/* Side strip indicator */}
        {sideStripColor && (
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${sideStripColor} z-10`}
          />
        )}

        {/* Role header */}
        <div
          className={`bg-gradient-to-r ${nodeColor.header} text-white p-2 text-center font-bold text-sm`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEdit(node.id, "role", node.role);
          }}
        >
          {editingNode?.nodeId === node.id && editingNode?.field === "role" ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSaveEdit();
                } else if (e.key === "Escape") {
                  onCancelEdit();
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              autoFocus
              className="w-full bg-white text-gray-900 px-1 py-0 text-center font-bold text-sm rounded border-2 border-blue-500 focus:outline-none"
            />
          ) : (
            node.role
          )}
        </div>

        {/* Name section */}
        <div
          className={`${nodeColor.body} p-3 text-center text-[17.5px] font-medium text-gray-800 flex items-center justify-center`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEdit(node.id, "name", node.name);
          }}
        >
          {editingNode?.nodeId === node.id && editingNode?.field === "name" ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSaveEdit();
                } else if (e.key === "Escape") {
                  onCancelEdit();
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              autoFocus
              className="w-full bg-white text-gray-900 px-1 py-0 text-center font-medium text-[17.5px] rounded border-2 border-blue-500 focus:outline-none"
            />
          ) : (
            node.name
          )}
        </div>
      </div>

      {/* Bottom drop zone indicator */}
      {isDragOver &&
        dragOverPosition === "bottom" &&
        draggingNodeId !== node.id && (
          <div
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y + NODE_HEIGHT + 6}px`,
              width: `${NODE_WIDTH}px`,
              height: "4px",
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          />
        )}
    </div>
  );
};

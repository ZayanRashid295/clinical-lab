import React from "react";
import { FlatNode } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { DropPosition } from "../hooks/useOrgChartDrag";
import { getNodeColor } from "../utils/color-utils";
import {
  NODE_WIDTH_VERTICAL,
  NODE_WIDTH_HORIZONTAL,
  NODE_HEIGHT_VERTICAL,
  NODE_HEIGHT_HORIZONTAL,
  TITLE_HEIGHT_VERTICAL,
  TITLE_WIDTH_HORIZONTAL,
  FONT_SIZE_TITLE_VERTICAL,
  FONT_SIZE_TITLE_HORIZONTAL,
  FONT_SIZE_NAME_VERTICAL,
  FONT_SIZE_NAME_HORIZONTAL,
} from "../constants";

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
  isHorizontalLayout: boolean;
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
  isHorizontalLayout,
}) => {
  const nodeColor = getNodeColor(node.id);
  const { x, y } = position;

  // Select constants based on layout mode
  const nodeWidth = isHorizontalLayout
    ? NODE_WIDTH_HORIZONTAL
    : NODE_WIDTH_VERTICAL;
  const nodeHeight = isHorizontalLayout
    ? NODE_HEIGHT_HORIZONTAL
    : NODE_HEIGHT_VERTICAL;
  const titleFontSize = isHorizontalLayout
    ? FONT_SIZE_TITLE_HORIZONTAL
    : FONT_SIZE_TITLE_VERTICAL;
  const nameFontSize = isHorizontalLayout
    ? FONT_SIZE_NAME_HORIZONTAL
    : FONT_SIZE_NAME_VERTICAL;

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
              width: `${nodeWidth}px`,
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
              height: `${nodeHeight}px`,
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
              left: `${x + nodeWidth + 6}px`,
              top: `${y}px`,
              width: "4px",
              height: `${nodeHeight}px`,
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
          width: `${nodeWidth}px`,
          height: `${nodeHeight}px`,
          opacity: isDragging ? 0.5 : 1,
          cursor:
            editingNode?.nodeId === node.id
              ? "text"
              : isDragging
              ? "grabbing"
              : "grab",
          zIndex: isDragging ? 1000 : "auto",
        }}
        className={`rounded-lg shadow-xl border-2 overflow-hidden transition-all relative flex ${
          isHorizontalLayout ? "flex-row" : "flex-col"
        } ${
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
          className={`bg-gradient-to-r ${nodeColor.header} text-white p-2 flex items-center justify-center font-bold flex-shrink-0 ${
            isHorizontalLayout
              ? "border-r-2 border-white/20"
              : "border-b-2 border-white/20"
          }`}
          style={{
            ...(isHorizontalLayout
              ? { width: `${TITLE_WIDTH_HORIZONTAL}px` }
              : { height: `${TITLE_HEIGHT_VERTICAL}px` }),
            fontSize: `${titleFontSize}px`,
          }}
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
              className="w-full bg-white text-gray-900 px-1 py-0 text-center font-bold rounded border-2 border-blue-500 focus:outline-none"
              style={{ fontSize: `${titleFontSize}px` }}
            />
          ) : (
            <span className="truncate block text-center w-full">
              {node.role}
            </span>
          )}
        </div>

        {/* Name section */}
        <div
          className={`${nodeColor.body} flex-1 flex items-center justify-center text-center font-medium text-gray-800 px-3 ${
            isHorizontalLayout ? "" : "min-h-0"
          }`}
          style={{
            ...(isHorizontalLayout
              ? { width: `${nodeWidth - TITLE_WIDTH_HORIZONTAL}px` }
              : {}),
            fontSize: `${nameFontSize}px`,
          }}
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
              className="w-full bg-white text-gray-900 px-1 py-0 text-center font-medium rounded border-2 border-blue-500 focus:outline-none"
              style={{ fontSize: `${nameFontSize}px` }}
            />
          ) : (
            <span className="truncate block w-full">{node.name}</span>
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
              top: `${y + nodeHeight + 6}px`,
              width: `${nodeWidth}px`,
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

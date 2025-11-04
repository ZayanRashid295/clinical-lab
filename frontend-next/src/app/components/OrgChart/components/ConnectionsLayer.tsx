import React from "react";
import { Connection } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import {
  NODE_WIDTH_VERTICAL,
  NODE_WIDTH_HORIZONTAL,
  NODE_HEIGHT_HORIZONTAL,
  NODE_HEIGHT_VERTICAL,
} from "../constants";

interface ConnectionsLayerProps {
  connections: Connection[];
  positions: Map<string, { x: number; y: number }>;
  canvasWidth: number;
  canvasHeight: number;
  isHorizontalLayout: boolean;
}

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({
  connections,
  positions,
  canvasWidth,
  canvasHeight,
  isHorizontalLayout,
}) => {
  const nodeHeight = isHorizontalLayout
    ? NODE_HEIGHT_HORIZONTAL
    : NODE_HEIGHT_VERTICAL;
  const nodeWidth = isHorizontalLayout
    ? NODE_WIDTH_HORIZONTAL
    : NODE_WIDTH_VERTICAL;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ overflow: "visible" }}
    >
      {connections.map((conn) => {
        const fromPos = positions.get(conn.from);
        const toPos = positions.get(conn.to);
        if (!fromPos || !toPos) return null;

        if (isHorizontalLayout) {
          // Horizontal layout: parent on left, children on right
          // Calculate connection points
          const fromX = fromPos.x + nodeWidth;
          const fromY = fromPos.y + nodeHeight / 2;
          const toX = toPos.x;
          const toY = toPos.y + nodeHeight / 2;

          // Create vertical-horizontal path (right-angle)
          const midX = fromX + (toX - fromX) / 2;
          const d = `M ${fromX},${fromY} L ${midX},${fromY} L ${midX},${toY} L ${toX},${toY}`;

          return (
            <path
              key={conn.id}
              d={d}
              fill="none"
              stroke="#6b7280"
              strokeWidth={2}
            />
          );
        } else {
          // Vertical layout: parent on top, children below
          // Calculate connection points
          const fromX = fromPos.x + nodeWidth / 2;
          const fromY = fromPos.y + nodeHeight;
          const toX = toPos.x + nodeWidth / 2;
          const toY = toPos.y;

          // Create horizontal-vertical path (right-angle)
          const midY = fromY + (toY - fromY) / 2;
          const d = `M ${fromX},${fromY} L ${fromX},${midY} L ${toX},${midY} L ${toX},${toY}`;

          return (
            <path
              key={conn.id}
              d={d}
              fill="none"
              stroke="#6b7280"
              strokeWidth={2}
            />
          );
        }
      })}
    </svg>
  );
};

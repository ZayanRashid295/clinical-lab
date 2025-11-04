import React from "react";
import { Connection } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { NODE_WIDTH, NODE_HEIGHT } from "../constants";

interface ConnectionsLayerProps {
  connections: Connection[];
  positions: Map<string, { x: number; y: number }>;
  canvasWidth: number;
  canvasHeight: number;
}

export const ConnectionsLayer: React.FC<ConnectionsLayerProps> = ({
  connections,
  positions,
  canvasWidth,
  canvasHeight,
}) => {
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

        // Calculate connection points
        const fromX = fromPos.x + NODE_WIDTH / 2;
        const fromY = fromPos.y + NODE_HEIGHT;
        const toX = toPos.x + NODE_WIDTH / 2;
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
      })}
    </svg>
  );
};

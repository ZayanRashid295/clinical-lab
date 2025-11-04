import React from "react";
import { FlatNode } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { DropPosition } from "../hooks/useOrgChartDrag";
import { OrgChartNodeVertical } from "./OrgChartNodeVertical";
import { OrgChartNodeHorizontal } from "./OrgChartNodeHorizontal";

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

export const OrgChartNode: React.FC<OrgChartNodeProps> = (props) => {
  const { isHorizontalLayout, ...restProps } = props;

  if (isHorizontalLayout) {
    return <OrgChartNodeHorizontal {...restProps} />;
  } else {
    return <OrgChartNodeVertical {...restProps} />;
  }
};

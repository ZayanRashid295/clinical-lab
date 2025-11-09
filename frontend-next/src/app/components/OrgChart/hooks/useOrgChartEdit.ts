import { useState, useCallback } from "react";
import {
  OrgChartNode,
  OrgChartData,
} from "@/app/components/OrgChart/org-chart-types/org-chart-model";

export function useOrgChartEdit(
  data: OrgChartData,
  setData: React.Dispatch<React.SetStateAction<OrgChartData>>
) {
  const [editingNode, setEditingNode] = useState<{
    nodeId: string;
    field: "role" | "name";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleStartEdit = useCallback(
    (nodeId: string, field: "role" | "name", currentValue: string) => {
      setEditingNode({ nodeId, field });
      setEditValue(currentValue);
    },
    []
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingNode || !editValue.trim()) {
      setEditingNode(null);
      return;
    }

    const { nodeId, field } = editingNode;

    // Deep clone the hierarchy
    const newHierarchy = JSON.parse(
      JSON.stringify(data.hierarchy)
    ) as OrgChartNode[];

    // Find and update the node
    const updateNodeInHierarchy = (nodes: OrgChartNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          if (field === "role") {
            node.role = editValue.trim();
          } else {
            node.name = editValue.trim();
          }
          return true;
        }
        if (node.children && updateNodeInHierarchy(node.children)) {
          return true;
        }
      }
      return false;
    };

    updateNodeInHierarchy(newHierarchy);

    // Update state
    setData((prevData) => ({
      ...prevData,
      hierarchy: newHierarchy,
    }));

    // Clear editing state
    setEditingNode(null);
    setEditValue("");
  }, [editingNode, editValue, data.hierarchy, setData]);

  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
    setEditValue("");
  }, []);

  return {
    editingNode,
    editValue,
    setEditValue,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
  };
}

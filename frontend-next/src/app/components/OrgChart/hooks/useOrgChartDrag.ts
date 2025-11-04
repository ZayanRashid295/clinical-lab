import { useState, useRef, useCallback } from "react";
import {
  OrgChartNode,
  OrgChartData,
} from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import {
  NODE_WIDTH_VERTICAL,
  NODE_WIDTH_HORIZONTAL,
  NODE_HEIGHT_HORIZONTAL,
  NODE_HEIGHT_VERTICAL,
} from "../constants";
import {
  findNodeInHierarchy,
  findNodePath,
  isDescendant,
  createNewArrayStructure,
} from "../utils/hierarchy-utils";

export type DropPosition = "top" | "bottom" | "left" | "right" | "center";

export type DebugLogEntry = {
  timestamp: string;
  type: "drag-start" | "snap" | "release";
  sourceNode?: string;
  destinationNode?: string;
  position?: string;
  beforeHierarchy?: OrgChartNode[];
  afterHierarchy?: OrgChartNode[];
};

export function useOrgChartDrag(
  data: OrgChartData,
  setData: React.Dispatch<React.SetStateAction<OrgChartData>>,
  zoom: number,
  setIsScrollEnabled: (enabled: boolean) => void,
  isHorizontalLayout: boolean = false
) {
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<DropPosition>("center");
  const [releasedNodeId, setReleasedNodeId] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<DebugLogEntry[]>([]);

  const lastValidDropTarget = useRef<{
    nodeId: string;
    position: DropPosition;
  } | null>(null);

  // Calculate drop position from mouse coordinates
  const calculateDropPosition = (e: React.DragEvent): DropPosition => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Use a 25% threshold for edges to make center region larger
    const edgeThreshold = 0.25;

    // Check vertical position first (above/below)
    if (y < height * edgeThreshold) {
      return "top";
    } else if (y > height * (1 - edgeThreshold)) {
      return "bottom";
    }
    // Check horizontal position (left/right)
    else if (x < width * edgeThreshold) {
      return "left";
    } else if (x > width * (1 - edgeThreshold)) {
      return "right";
    }
    // Center region (as child)
    else {
      return "center";
    }
  };

  const handleDragStart = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      e.stopPropagation();
      setDraggingNodeId(nodeId);

      // Find node for debug display
      const sourceNode = findNodeInHierarchy(data.hierarchy, nodeId);

      // Create a custom drag image that respects the zoom level
      const target = e.currentTarget as HTMLElement;

      // Clone the element
      const dragImage = target.cloneNode(false) as HTMLElement;

      // Use correct width and height based on layout mode
      const nodeWidth = isHorizontalLayout
        ? NODE_WIDTH_HORIZONTAL
        : NODE_WIDTH_VERTICAL;
      const nodeHeight = isHorizontalLayout
        ? NODE_HEIGHT_HORIZONTAL
        : NODE_HEIGHT_VERTICAL;

      // Set dimensions - scale the container size
      dragImage.style.width = `${nodeWidth * zoom}px`;
      dragImage.style.height = `${nodeHeight * zoom}px`;
      dragImage.style.position = "fixed";
      dragImage.style.left = "-9999px";
      dragImage.style.top = "-9999px";
      dragImage.style.opacity = "0.125";
      dragImage.style.pointerEvents = "none";
      dragImage.style.zIndex = "999999";

      // Append to body temporarily
      document.body.appendChild(dragImage);

      // Force reflow to ensure element is rendered
      void dragImage.offsetHeight;

      // Set the drag image - offset needs to account for scale
      const offsetX = (nodeWidth * zoom) / 2;
      const offsetY = (nodeHeight * zoom) / 2;
      e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

      // Clean up after drag starts
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);

      // Add debug log entry for drag start
      setDebugLog((prevLog) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: "drag-start",
          sourceNode: sourceNode ? `${sourceNode.name} (${nodeId})` : nodeId,
        },
        ...prevLog.slice(0, 49), // Keep last 50 entries
      ]);

      // Prevent scrolling during drag
      setIsScrollEnabled(false);
    },
    [data.hierarchy, zoom, setIsScrollEnabled, isHorizontalLayout]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingNodeId(null);
    setDragOverNodeId(null);
    lastValidDropTarget.current = null;
    setIsScrollEnabled(true);
  }, [setIsScrollEnabled]);

  const handleDragOver = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      if (!draggingNodeId || draggingNodeId === nodeId) return;

      e.preventDefault();
      e.stopPropagation();

      // Calculate drop position
      const position = calculateDropPosition(e);
      setDragOverPosition(position);

      // Store the last valid drop target
      lastValidDropTarget.current = { nodeId, position };

      // Only log snap if it's a different node or different position
      if (dragOverNodeId !== nodeId || dragOverPosition !== position) {
        const sourceNode = findNodeInHierarchy(data.hierarchy, draggingNodeId);
        const destNode = findNodeInHierarchy(data.hierarchy, nodeId);

        // Add debug log entry for snap
        setDebugLog((prevLog) => [
          {
            timestamp: new Date().toLocaleTimeString(),
            type: "snap",
            sourceNode: sourceNode
              ? `${sourceNode.name} (${draggingNodeId})`
              : draggingNodeId,
            destinationNode: destNode ? `${destNode.name} (${nodeId})` : nodeId,
            position,
          },
          ...prevLog.slice(0, 49),
        ]);
      }

      setDragOverNodeId(nodeId);
    },
    [draggingNodeId, dragOverNodeId, dragOverPosition, data.hierarchy]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetNodeId?: string) => {
      // If no targetNodeId provided, use the last valid drop target
      const actualTargetId =
        targetNodeId || lastValidDropTarget.current?.nodeId;
      const dropPosition = targetNodeId
        ? calculateDropPosition(e)
        : lastValidDropTarget.current?.position || "center";

      // Validate drop conditions
      if (
        !draggingNodeId ||
        !actualTargetId ||
        draggingNodeId === actualTargetId
      ) {
        handleDragEnd();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const insertPosition: "before" | "after" | "child" =
        dropPosition === "center" || dropPosition === "bottom"
          ? "child"
          : dropPosition === "top" || dropPosition === "left"
          ? "before"
          : "after";

      // Store IDs before clearing state
      const currentDraggingId = draggingNodeId;
      const currentTargetId = actualTargetId;

      // Deep clone the entire structure
      const newHierarchy = JSON.parse(
        JSON.stringify(data.hierarchy)
      ) as OrgChartNode[];

      // Find paths to both items
      const draggedPath = findNodePath(newHierarchy, currentDraggingId);
      const targetPath = findNodePath(newHierarchy, currentTargetId);

      if (!draggedPath || !targetPath) {
        console.error("Could not find dragged or target node");
        handleDragEnd();
        return;
      }

      // Prevent dropping on descendants
      if (isDescendant(newHierarchy, currentDraggingId, currentTargetId)) {
        handleDragEnd();
        return;
      }

      // Get the dragged item (deep clone)
      const draggedPathLast = draggedPath[draggedPath.length - 1];
      const draggedItem = JSON.parse(
        JSON.stringify(draggedPathLast.array[draggedPathLast.index])
      ) as OrgChartNode;

      // Ensure children array exists
      if (!draggedItem.children) {
        draggedItem.children = [];
      }

      // Get source and target arrays and indices
      const sourceArray = draggedPathLast.array;
      const targetPathLast = targetPath[targetPath.length - 1];
      const targetArray = targetPathLast.array;
      const draggedIndex = draggedPathLast.index;
      let targetIndex = targetPathLast.index;

      // Check if moving within the same array
      const sameArray = sourceArray === targetArray;

      if (insertPosition === "child") {
        // Add as child of target node
        sourceArray.splice(draggedIndex, 1);

        // Ensure target has children array
        if (!targetArray[targetIndex].children) {
          targetArray[targetIndex].children = [];
        }

        // Add to target's children
        targetArray[targetIndex].children!.push(draggedItem);
      } else {
        // Add as sibling (before or after)
        if (sameArray) {
          if (insertPosition === "after") {
            if (draggedIndex < targetIndex) {
              sourceArray.splice(draggedIndex, 1);
              targetArray.splice(targetIndex, 0, draggedItem);
            } else if (draggedIndex > targetIndex) {
              sourceArray.splice(draggedIndex, 1);
              targetArray.splice(targetIndex + 1, 0, draggedItem);
            } else {
              targetArray.splice(targetIndex + 1, 0, draggedItem);
              sourceArray.splice(draggedIndex, 1);
            }
          } else {
            // "before"
            if (draggedIndex < targetIndex) {
              sourceArray.splice(draggedIndex, 1);
              targetArray.splice(targetIndex - 1, 0, draggedItem);
            } else if (draggedIndex > targetIndex) {
              sourceArray.splice(draggedIndex, 1);
              targetArray.splice(targetIndex, 0, draggedItem);
            } else {
              targetArray.splice(targetIndex, 0, draggedItem);
              sourceArray.splice(draggedIndex, 1);
            }
          }
        } else {
          // Different arrays
          sourceArray.splice(draggedIndex, 1);

          if (insertPosition === "after") {
            targetIndex += 1;
          }

          targetArray.splice(targetIndex, 0, draggedItem);
        }
      }

      // Create a completely new array structure
      const updatedHierarchy = createNewArrayStructure(newHierarchy);

      // Find node names for debug display
      const sourceNode = findNodeInHierarchy(data.hierarchy, currentDraggingId);
      const destNode = findNodeInHierarchy(data.hierarchy, currentTargetId);

      // Add debug log entry for release
      setDebugLog((prevLog) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          type: "release",
          sourceNode: sourceNode
            ? `${sourceNode.name} (${currentDraggingId})`
            : `${currentDraggingId}`,
          destinationNode: destNode
            ? `${destNode.name} (${currentTargetId})`
            : `${currentTargetId}`,
          position: dropPosition,
        },
        ...prevLog.slice(0, 49),
      ]);

      // Set released node for visual feedback
      setReleasedNodeId(currentTargetId);

      // Clear drag state first
      handleDragEnd();

      // Clear released indicator after a short delay
      setTimeout(() => {
        setReleasedNodeId(null);
      }, 2000);

      // Update state with new hierarchy
      setData((prevData) => ({
        organizationName: prevData.organizationName,
        description: prevData.description,
        hierarchy: updatedHierarchy,
      }));
    },
    [draggingNodeId, data.hierarchy, handleDragEnd, setData]
  );

  return {
    draggingNodeId,
    dragOverNodeId,
    dragOverPosition,
    releasedNodeId,
    debugLog,
    lastValidDropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    setDebugLog,
  };
}

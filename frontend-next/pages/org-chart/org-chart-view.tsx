import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from "lucide-react";
import {
  OrgChartData,
  OrgChartNode,
  Point,
  Connection,
  FlatNode,
} from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { initialOrgData } from "@/app/components/OrgChart/org-chart-data";

const nodeColors = [
  { header: "from-violet-600 to-violet-700", body: "bg-violet-50" },
  { header: "from-cyan-600 to-cyan-700", body: "bg-cyan-50" },
  { header: "from-blue-600 to-blue-700", body: "bg-blue-50" },
  { header: "from-purple-600 to-purple-700", body: "bg-purple-50" },
  { header: "from-amber-600 to-amber-700", body: "bg-amber-50" },
  { header: "from-red-600 to-red-700", body: "bg-red-50" },
  { header: "from-pink-600 to-pink-700", body: "bg-pink-50" },
  { header: "from-green-600 to-green-700", body: "bg-green-50" },
  { header: "from-indigo-600 to-indigo-700", body: "bg-indigo-50" },
  { header: "from-teal-600 to-teal-700", body: "bg-teal-50" },
  { header: "from-orange-600 to-orange-700", body: "bg-orange-50" },
  { header: "from-rose-600 to-rose-700", body: "bg-rose-50" },
  { header: "from-emerald-600 to-emerald-700", body: "bg-emerald-50" },
  { header: "from-slate-600 to-slate-700", body: "bg-slate-50" },
  { header: "from-stone-600 to-stone-700", body: "bg-stone-50" },
];

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const NODE_HORIZONTAL_GAP = 50;
const NODE_VERTICAL_GAP = 100;
const LEVEL_START_Y = 100;
const CANVAS_PADDING = 100;

function hashToIndex(key: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

function getNodeColor(nodeId: string) {
  const index = hashToIndex(nodeId, nodeColors.length);
  return nodeColors[index];
}

// Flatten hierarchical structure to flat nodes with parentId and level
function flattenHierarchy(
  nodes: OrgChartNode[],
  parentId?: string,
  level: number = 0
): FlatNode[] {
  const flatNodes: FlatNode[] = [];
  nodes.forEach((node) => {
    const flatNode: FlatNode = {
      id: node.id,
      role: node.role,
      name: node.name,
      parentId,
      level,
    };
    flatNodes.push(flatNode);
    if (node.children && node.children.length > 0) {
      const childNodes = flattenHierarchy(node.children, node.id, level + 1);
      flatNodes.push(...childNodes);
    }
  });
  return flatNodes;
}

// Build hierarchy map from flat nodes
function buildHierarchyMap(flatNodes: FlatNode[]): Map<string, FlatNode[]> {
  const hierarchy = new Map<string, FlatNode[]>();
  flatNodes.forEach((node) => {
    const parentId = node.parentId || "root";
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }
    hierarchy.get(parentId)!.push(node);
  });
  return hierarchy;
}

function calculatePositions(
  flatNodes: FlatNode[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const hierarchy = buildHierarchyMap(flatNodes);
  const nodeMap = new Map(flatNodes.map((n) => [n.id, n]));
  const allFlatNodes = flatNodes; // Store for recursive adjustment

  // Find root nodes (nodes without parentId)
  const rootNodes = flatNodes.filter((n) => !n.parentId);
  if (rootNodes.length === 0) return positions;

  // Helper to recursively adjust all descendants
  const adjustSubtree = (nodeId: string, offset: number) => {
    const currentPos = positions.get(nodeId);
    if (currentPos) {
      positions.set(nodeId, { ...currentPos, x: currentPos.x + offset });
    }

    // Recursively adjust all children
    const children = hierarchy.get(nodeId) || [];
    children.forEach((child) => {
      adjustSubtree(child.id, offset);
    });
  };

  // Recursive function to calculate positions
  const calculateNodePosition = (
    nodeId: string,
    level: number,
    startX: number
  ): { x: number; width: number } => {
    const node = nodeMap.get(nodeId);
    if (!node) return { x: startX, width: NODE_WIDTH };

    const children = hierarchy.get(nodeId) || [];

    if (children.length === 0) {
      // Leaf node - position at startX
      const x = startX;
      const y = LEVEL_START_Y + level * (NODE_HEIGHT + NODE_VERTICAL_GAP);
      positions.set(nodeId, { x, y });
      return { x, width: NODE_WIDTH };
    }

    // If there's only one child, center it directly below the parent
    if (children.length === 1) {
      // Position the parent at startX
      const parentX = startX;
      const parentY = LEVEL_START_Y + level * (NODE_HEIGHT + NODE_VERTICAL_GAP);
      positions.set(nodeId, { x: parentX, y: parentY });

      // Calculate child subtree width first (recursively, starting at 0)
      const childPos = calculateNodePosition(children[0].id, level + 1, 0);

      // Center the child directly below the parent
      // Parent center is at: parentX + NODE_WIDTH / 2
      // Child center should align with parent center
      // So child left edge should be at: (parentX + NODE_WIDTH / 2) - NODE_WIDTH / 2 = parentX
      // This means child.left = parent.left, which centers them
      const parentCenterX = parentX + NODE_WIDTH / 2;
      const centeredChildX = parentCenterX - NODE_WIDTH / 2;

      // Get the child's current position and adjust it
      const childCurrentPos = positions.get(children[0].id);
      if (childCurrentPos) {
        const offset = centeredChildX - childCurrentPos.x;
        // Adjust the child and all its descendants
        adjustSubtree(children[0].id, offset);
      }

      return {
        x: parentX,
        width: Math.max(NODE_WIDTH, childPos.width),
      };
    }

    // Multiple children - calculate positions for all children
    let currentX = startX;
    let totalChildrenWidth = 0;
    const childPositions: Array<{ x: number; width: number }> = [];

    children.forEach((child) => {
      const childPos = calculateNodePosition(child.id, level + 1, currentX);
      childPositions.push(childPos);
      currentX += childPos.width + NODE_HORIZONTAL_GAP;
      totalChildrenWidth += childPos.width;
    });

    // Remove last gap
    totalChildrenWidth += (children.length - 1) * NODE_HORIZONTAL_GAP;

    // Position parent in the center of its children
    const firstChildX = childPositions[0]?.x ?? startX;
    const lastChildX = childPositions[childPositions.length - 1]?.x ?? startX;
    const centerX = (firstChildX + lastChildX) / 2;
    const x = centerX - NODE_WIDTH / 2;

    const y = LEVEL_START_Y + level * (NODE_HEIGHT + NODE_VERTICAL_GAP);
    positions.set(nodeId, { x, y });

    return {
      x: firstChildX,
      width: Math.max(NODE_WIDTH, totalChildrenWidth),
    };
  };

  // Calculate from all root nodes - start from 0
  let totalRootWidth = 0;
  rootNodes.forEach((rootNode) => {
    const rootPos = calculateNodePosition(rootNode.id, 0, totalRootWidth);
    totalRootWidth += rootPos.width + NODE_HORIZONTAL_GAP;
  });

  // Find the actual bounds of all nodes
  let minX = Infinity;
  let maxX = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
  });

  // Calculate offset to ensure all nodes are visible (pad left side)
  // Add padding to ensure we can scroll left if needed
  const leftPadding = CANVAS_PADDING;
  const offset = leftPadding - minX;

  // Apply offset to all positions
  positions.forEach((pos, nodeId) => {
    positions.set(nodeId, { ...pos, x: pos.x + offset });
  });

  return positions;
}

function buildConnections(
  flatNodes: FlatNode[],
  positions: Map<string, { x: number; y: number }>
): Connection[] {
  const connections: Connection[] = [];
  flatNodes.forEach((node) => {
    if (node.parentId) {
      const fromPos = positions.get(node.parentId);
      const toPos = positions.get(node.id);
      if (fromPos && toPos) {
        connections.push({
          id: `${node.parentId}-${node.id}`,
          from: node.parentId,
          to: node.id,
        });
      }
    }
  });
  return connections;
}

function OrgChartView() {
  const [data, setData] = useState<OrgChartData>(initialOrgData);
  const [zoom, setZoom] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "top" | "bottom" | "center"
  >("center");
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const [jsonPanelWidth, setJsonPanelWidth] = useState<number>(400);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<HTMLDivElement>(null);

  // Flatten hierarchical structure for rendering
  const flatNodes = useMemo(
    () => flattenHierarchy(data.hierarchy),
    [data.hierarchy]
  );

  const positions = useMemo(() => calculatePositions(flatNodes), [flatNodes]);
  const connections = useMemo(
    () => buildConnections(flatNodes, positions),
    [flatNodes, positions]
  );

  // Calculate canvas dimensions
  const { canvasWidth, canvasHeight } = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = 0;
    positions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + NODE_WIDTH);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
    });
    // Ensure minimum width and add padding on both sides
    const width = Math.max(maxX - minX + CANVAS_PADDING * 2, 2000);
    const height = maxY + CANVAS_PADDING;
    return {
      canvasWidth: width,
      canvasHeight: height,
    };
  }, [positions]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Don't start panning if dragging a node
    if (e.button !== 0 || draggingNodeId) return;
    e.preventDefault();
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainer.scrollLeft,
        scrollTop: scrollContainer.scrollTop,
      });
    }
  };

  // Function to find node in hierarchy and remove it
  const removeNodeFromHierarchy = (
    nodes: OrgChartNode[],
    nodeId: string
  ): OrgChartNode[] => {
    return nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => {
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: removeNodeFromHierarchy(node.children, nodeId),
          };
        }
        return node;
      });
  };

  // Function to find node in hierarchy
  const findNodeInHierarchy = (
    nodes: OrgChartNode[],
    nodeId: string
  ): OrgChartNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNodeInHierarchy(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to add node to a parent in hierarchy
  const addNodeToParent = (
    nodes: OrgChartNode[],
    parentId: string | null,
    node: OrgChartNode
  ): OrgChartNode[] => {
    if (parentId === null) {
      // Add as root node
      return [...nodes, { ...node, children: [] }];
    }

    return nodes.map((n) => {
      if (n.id === parentId) {
        return {
          ...n,
          children: [
            ...(n.children || []),
            { ...node, children: node.children || [] },
          ],
        };
      }
      if (n.children) {
        return {
          ...n,
          children: addNodeToParent(n.children, parentId, node),
        };
      }
      return n;
    });
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);

    // Prevent scrolling during drag
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.style.overflow = "hidden";
    }
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    setDragOverNodeId(null);

    // Re-enable scrolling after drag
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.style.overflow = "auto";
    }
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    if (!draggingNodeId || draggingNodeId === nodeId) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Determine drop position: top (as sibling before), bottom (as sibling after), or center (as child)
    if (y < height * 0.3) {
      setDragOverPosition("top");
    } else if (y > height * 0.7) {
      setDragOverPosition("bottom");
    } else {
      setDragOverPosition("center");
    }

    setDragOverNodeId(nodeId);
  };

  // Function to find parent of a node
  const findParent = (
    nodes: OrgChartNode[],
    childId: string,
    parent: OrgChartNode | null = null
  ): OrgChartNode | null => {
    for (const node of nodes) {
      if (node.id === childId) return parent;
      if (node.children) {
        const found = findParent(node.children, childId, node);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    if (!draggingNodeId || draggingNodeId === targetNodeId) return;

    // Prevent dropping on descendants (can't make a node a child of its own descendant)
    const isDescendant = (
      ancestorId: string,
      descendantId: string
    ): boolean => {
      const ancestor = findNodeInHierarchy(data.hierarchy, ancestorId);
      if (!ancestor || !ancestor.children) return false;
      if (ancestor.children.some((child) => child.id === descendantId))
        return true;
      return ancestor.children.some((child) =>
        isDescendant(child.id, descendantId)
      );
    };

    if (isDescendant(draggingNodeId, targetNodeId)) {
      handleDragEnd();
      return; // Can't drop on descendant
    }

    e.preventDefault();
    e.stopPropagation();

    const draggedNode = findNodeInHierarchy(data.hierarchy, draggingNodeId);
    if (!draggedNode) {
      handleDragEnd();
      return;
    }

    // Create a deep copy of the node to move
    const nodeToMove: OrgChartNode = {
      id: draggedNode.id,
      role: draggedNode.role,
      name: draggedNode.name,
      children: draggedNode.children
        ? JSON.parse(JSON.stringify(draggedNode.children))
        : [],
    };

    // Remove node from current location
    let updatedHierarchy = removeNodeFromHierarchy(
      data.hierarchy,
      draggingNodeId
    );

    // Add node to new location based on drag position
    if (dragOverPosition === "center") {
      // Add as child of target node
      updatedHierarchy = addNodeToParent(
        updatedHierarchy,
        targetNodeId,
        nodeToMove
      );
    } else {
      // Find target node's parent and add as sibling
      const parent = findParent(updatedHierarchy, targetNodeId);
      if (parent) {
        updatedHierarchy = addNodeToParent(
          updatedHierarchy,
          parent.id,
          nodeToMove
        );
      } else {
        // Target is root, add as root sibling
        updatedHierarchy = [...updatedHierarchy, nodeToMove];
      }
    }

    setData({
      ...data,
      hierarchy: updatedHierarchy,
    });

    handleDragEnd();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Don't pan if dragging a node
      if (
        !scrollContainerRef.current ||
        !isPanning ||
        !panStart ||
        draggingNodeId
      )
        return;
      e.preventDefault();
      const scrollContainer = scrollContainerRef.current;
      const deltaX = panStart.x - e.clientX;
      const deltaY = panStart.y - e.clientY;

      scrollContainer.scrollLeft = panStart.scrollLeft + deltaX;
      scrollContainer.scrollTop = panStart.scrollTop + deltaY;
    },
    [isPanning, panStart, draggingNodeId]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  useEffect(() => {
    if (!isPanning) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Scroll to show content on initial load
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && positions.size > 0) {
      // Find the leftmost node position
      let minX = Infinity;
      positions.forEach((pos) => {
        minX = Math.min(minX, pos.x);
      });
      // Scroll to show the leftmost content with some padding
      scrollContainer.scrollLeft = Math.max(0, minX * zoom - 50);
      scrollContainer.scrollTop = 0;
    }
  }, [positions, zoom]);

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("JSON copied to clipboard!");
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "org-chart-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = jsonPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;
      setJsonPanelWidth(Math.max(250, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
          border: 2px solid #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1f2937;
        }
      `,
        }}
      />
      <div className="bg-gray-950 border-b border-gray-800 p-4 flex-shrink-0 w-full">
        <div className="w-full">
          <div className="mb-4">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold text-white">
                {data.organizationName}
              </h1>
              <span className="text-lg font-semibold text-blue-400">
                {flatNodes.length} {flatNodes.length === 1 ? "node" : "nodes"}
              </span>
            </div>
            <p className="text-gray-400 mt-2">{data.description}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex gap-3 items-center flex-shrink-0">
        <div className="flex gap-2 items-center ml-auto">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-gray-400 text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={copyJSON}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Copy size={16} /> Copy
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            <Download size={16} /> Download
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            {showSidebar ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </button>
          <button
            onClick={() => setShowJsonPanel(!showJsonPanel)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title={showJsonPanel ? "Hide JSON panel" : "Show JSON panel"}
          >
            {showJsonPanel ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelRight size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
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
                      <div className="font-semibold text-white">
                        {node.role}
                      </div>
                      <div className="text-gray-400">{node.name}</div>
                      {pos && (
                        <div className="text-gray-500 mt-1">
                          Level {node.level}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 bg-gray-800 relative overflow-auto custom-scrollbar"
            onMouseDown={handleCanvasMouseDown}
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
          >
            <div
              ref={transformWrapperRef}
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                minWidth: `${canvasWidth}px`,
              }}
            >
              {/* SVG connections overlay */}
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={canvasWidth}
                height={canvasHeight}
                style={{ overflow: "visible" }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="5"
                    orient="auto"
                  >
                    <polygon points="0,0 10,5 0,10" fill="#6b7280" />
                  </marker>
                </defs>
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
                  // Go down from parent, then horizontally to child's x, then down to child
                  const midY = fromY + (toY - fromY) / 2;
                  const d = `M ${fromX},${fromY} L ${fromX},${midY} L ${toX},${midY} L ${toX},${toY}`;

                  return (
                    <path
                      key={conn.id}
                      d={d}
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {flatNodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const nodeColor = getNodeColor(node.id);
                const x = pos.x;
                const y = pos.y;
                const isDragging = draggingNodeId === node.id;
                const isDragOver = dragOverNodeId === node.id;
                const canDropAsChild =
                  isDragOver && dragOverPosition === "center";
                const canDropAsSibling =
                  isDragOver &&
                  (dragOverPosition === "top" || dragOverPosition === "bottom");

                return (
                  <div key={node.id}>
                    {/* Drop zone indicator - top (as sibling before) */}
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

                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", node.id);
                        handleDragStart(e, node.id);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        handleDragEnd();
                      }}
                      onDragOver={(e) => handleDragOver(e, node.id)}
                      onDrop={(e) => handleDrop(e, node.id)}
                      onMouseDown={(e) => {
                        // Prevent canvas panning when clicking on node
                        e.stopPropagation();
                      }}
                      style={{
                        position: "absolute",
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${NODE_WIDTH}px`,
                        height: `${NODE_HEIGHT}px`,
                        opacity: isDragging ? 0.5 : 1,
                        cursor: isDragging ? "grabbing" : "grab",
                        zIndex: isDragging ? 1000 : "auto",
                      }}
                      className={`rounded-lg shadow-xl border-2 overflow-hidden transition-all ${
                        canDropAsChild
                          ? "border-blue-500 ring-4 ring-blue-300"
                          : canDropAsSibling
                          ? "border-blue-400"
                          : isDragOver
                          ? "border-blue-300"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {/* Role header */}
                      <div
                        className={`bg-gradient-to-r ${nodeColor.header} text-white p-2 text-center font-bold text-sm`}
                      >
                        {node.role}
                      </div>
                      {/* Name section */}
                      <div
                        className={`${nodeColor.body} p-3 text-center text-sm font-medium text-gray-800`}
                      >
                        {node.name}
                      </div>
                    </div>

                    {/* Drop zone indicator - bottom (as sibling after) */}
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
              })}
            </div>
          </div>
        </div>

        {showJsonPanel && (
          <div
            className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize flex-shrink-0 relative group"
            onMouseDown={handleResizeStart}
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
      </div>
    </div>
  );
}

export default OrgChartView;

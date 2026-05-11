import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { OrgChartData } from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import { initialOrgData } from "@/app/components/OrgChart/org-chart-data";
import { flattenHierarchy } from "./utils/hierarchy-utils";
import {
  calculatePositions,
  buildConnections,
  calculateCanvasDimensions,
} from "./utils/layout-utils";
import { useOrgChartDrag } from "./hooks/useOrgChartDrag";
import { useOrgChartEdit } from "./hooks/useOrgChartEdit";
import { useOrgChartJson } from "./hooks/useOrgChartJson";
import { OrgChartNode } from "./components/OrgChartNode";
import { ConnectionsLayer } from "./components/ConnectionsLayer";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { JsonPanel } from "./components/JsonPanel";
import { DebugPanel } from "./components/DebugPanel";
import { JsonEditorModal } from "./components/JsonEditorModal";

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
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const [jsonPanelWidth, setJsonPanelWidth] = useState<number>(400);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [debugPanelWidth, setDebugPanelWidth] = useState<number>(400);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isScrollEnabled, setIsScrollEnabled] = useState<boolean>(true);
  const [isHorizontalLayout, setIsHorizontalLayout] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const dragState = useOrgChartDrag(data, setData, zoom, setIsScrollEnabled, isHorizontalLayout);
  const editState = useOrgChartEdit(data, setData);
  const jsonState = useOrgChartJson(data, setData);

  // Flatten hierarchical structure for rendering
  const flatNodes = useMemo(
    () => flattenHierarchy(data.hierarchy),
    [data.hierarchy]
  );

  const positions = useMemo(
    () => calculatePositions(flatNodes, isHorizontalLayout),
    [flatNodes, isHorizontalLayout]
  );
  const connections = useMemo(
    () => buildConnections(flatNodes, positions),
    [flatNodes, positions]
  );

  // Calculate canvas dimensions
  const { canvasWidth, canvasHeight } = useMemo(
    () => calculateCanvasDimensions(positions, isHorizontalLayout),
    [positions, isHorizontalLayout]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Don't start panning if dragging a node
    if (e.button !== 0 || dragState.draggingNodeId) return;
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Don't pan if dragging a node
      if (
        !scrollContainerRef.current ||
        !isPanning ||
        !panStart ||
        dragState.draggingNodeId
      )
        return;
      e.preventDefault();
      const scrollContainer = scrollContainerRef.current;
      const deltaX = panStart.x - e.clientX;
      const deltaY = panStart.y - e.clientY;

      scrollContainer.scrollLeft = panStart.scrollLeft + deltaX;
      scrollContainer.scrollTop = panStart.scrollTop + deltaY;
    },
    [isPanning, panStart, dragState.draggingNodeId]
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

  const handleResizeStart = (
    e: React.MouseEvent,
    panelType: "json" | "debug"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = panelType === "json" ? jsonPanelWidth : debugPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;
      const clampedWidth = Math.max(250, Math.min(800, newWidth));
      if (panelType === "json") {
        setJsonPanelWidth(clampedWidth);
      } else {
        setDebugPanelWidth(clampedWidth);
      }
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

  const handleToggleDebugPanel = () => {
    const newShowDebugPanel = !showDebugPanel;
    setShowDebugPanel(newShowDebugPanel);
    // Close JSON panel when opening debug panel (mutual exclusivity)
    if (newShowDebugPanel && showJsonPanel) {
      setShowJsonPanel(false);
    }
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

      {/* Header */}
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
      <Toolbar
        zoom={zoom}
        onZoomIn={() => setZoom(Math.min(2, zoom + 0.1))}
        onZoomOut={() => setZoom(Math.max(0.1, zoom - 0.1))}
        onCopyJSON={jsonState.copyJSON}
        onPasteJSON={jsonState.handlePasteJSON}
        onEditJSON={jsonState.handleOpenJsonEditor}
        onDownloadJSON={jsonState.downloadJSON}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showJsonPanel={showJsonPanel}
        onToggleJsonPanel={() => setShowJsonPanel(!showJsonPanel)}
        showDebugPanel={showDebugPanel}
        onToggleDebugPanel={handleToggleDebugPanel}
        isHorizontalLayout={isHorizontalLayout}
        onToggleLayout={() => setIsHorizontalLayout(!isHorizontalLayout)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          showSidebar={showSidebar}
          flatNodes={flatNodes}
          positions={positions}
        />

        {/* Main Canvas */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 bg-gray-800 relative custom-scrollbar"
            onMouseDown={handleCanvasMouseDown}
            style={{
              cursor: isPanning ? "grabbing" : "grab",
              overflow: isScrollEnabled ? "auto" : "hidden",
            }}
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
              onDragOver={(e) => {
                // Prevent default to allow drop
                if (
                  dragState.draggingNodeId &&
                  dragState.lastValidDropTarget.current
                ) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                // Handle drop using last valid target if mouse is not over a node
                if (
                  dragState.draggingNodeId &&
                  dragState.lastValidDropTarget.current
                ) {
                  dragState.handleDrop(e);
                }
              }}
            >
              {/* SVG connections overlay */}
              <ConnectionsLayer
                connections={connections}
                positions={positions}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                isHorizontalLayout={isHorizontalLayout}
              />

              {/* Nodes */}
              {flatNodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const isDragging = dragState.draggingNodeId === node.id;
                const isDragOver = dragState.dragOverNodeId === node.id;
                const isReleased = dragState.releasedNodeId === node.id;

                return (
                  <OrgChartNode
                    key={node.id}
                    node={node}
                    position={pos}
                    isDragging={isDragging}
                    isDragOver={isDragOver}
                    isReleased={isReleased}
                    dragOverPosition={dragState.dragOverPosition}
                    draggingNodeId={dragState.draggingNodeId}
                    editingNode={editState.editingNode}
                    editValue={editState.editValue}
                    setEditValue={editState.setEditValue}
                    onDragStart={dragState.handleDragStart}
                    onDragEnd={dragState.handleDragEnd}
                    onDragOver={dragState.handleDragOver}
                    onDrop={dragState.handleDrop}
                    onStartEdit={editState.handleStartEdit}
                    onSaveEdit={editState.handleSaveEdit}
                    onCancelEdit={editState.handleCancelEdit}
                    isHorizontalLayout={isHorizontalLayout}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* JSON Panel */}
        <JsonPanel
          showJsonPanel={showJsonPanel}
          jsonPanelWidth={jsonPanelWidth}
          data={data}
          onResizeStart={(e) => handleResizeStart(e, "json")}
        />

        {/* Debug Panel */}
        <DebugPanel
          showDebugPanel={showDebugPanel}
          debugPanelWidth={debugPanelWidth}
          debugLog={dragState.debugLog}
          onClearLog={() => dragState.setDebugLog([])}
          onResizeStart={(e) => handleResizeStart(e, "debug")}
        />
      </div>

      {/* JSON Editor Modal */}
      <JsonEditorModal
        showJsonEditor={jsonState.showJsonEditor}
        jsonEditorValue={jsonState.jsonEditorValue}
        onValueChange={jsonState.setJsonEditorValue}
        onSave={jsonState.handleSaveJsonEdit}
        onCancel={jsonState.handleCancelJsonEdit}
      />
    </div>
  );
}

export default OrgChartView;

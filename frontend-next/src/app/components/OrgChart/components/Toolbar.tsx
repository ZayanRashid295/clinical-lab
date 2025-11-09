import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  ClipboardPaste,
  FileEdit,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  RefreshCw,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

interface ToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCopyJSON: () => void;
  onPasteJSON: () => void;
  onEditJSON: () => void;
  onDownloadJSON: () => void;
  onRefresh: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showJsonPanel: boolean;
  onToggleJsonPanel: () => void;
  showDebugPanel: boolean;
  onToggleDebugPanel: () => void;
  isHorizontalLayout: boolean;
  onToggleLayout: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onCopyJSON,
  onPasteJSON,
  onEditJSON,
  onDownloadJSON,
  onRefresh,
  showSidebar,
  onToggleSidebar,
  showJsonPanel,
  onToggleJsonPanel,
  showDebugPanel,
  onToggleDebugPanel,
  isHorizontalLayout,
  onToggleLayout,
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3 flex gap-3 items-center flex-shrink-0">
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
        title="Refresh view"
      >
        <RefreshCw size={16} /> Refresh
      </button>
      <div className="flex gap-2 items-center ml-auto">
        <button
          onClick={onZoomOut}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-gray-400 text-sm w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-6 bg-gray-600 mx-2" />
        <button
          onClick={onCopyJSON}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        >
          <Copy size={16} /> Copy
        </button>
        <button
          onClick={onPasteJSON}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
          title="Paste JSON from clipboard"
        >
          <ClipboardPaste size={16} /> Paste
        </button>
        <button
          onClick={onEditJSON}
          className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors"
          title="Edit JSON"
        >
          <FileEdit size={16} /> Edit
        </button>
        <button
          onClick={onDownloadJSON}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
        >
          <Download size={16} /> Download
        </button>
        <div className="w-px h-6 bg-gray-600 mx-2" />
        <button
          onClick={onToggleLayout}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
            isHorizontalLayout
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
          title={isHorizontalLayout ? "Switch to vertical layout" : "Switch to horizontal layout"}
        >
          {isHorizontalLayout ? <ArrowDown size={16} /> : <ArrowRight size={16} />}
          {isHorizontalLayout ? "Vertical" : "Horizontal"}
        </button>
        <div className="w-px h-6 bg-gray-600 mx-2" />
        <button
          onClick={onToggleSidebar}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title={showSidebar ? "Hide sidebar" : "Show sidebar"}
        >
          {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <button
          onClick={onToggleJsonPanel}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title={showJsonPanel ? "Hide JSON panel" : "Show JSON panel"}
        >
          {showJsonPanel ? (
            <PanelRightClose size={18} />
          ) : (
            <PanelRight size={18} />
          )}
        </button>
        <button
          onClick={onToggleDebugPanel}
          className={`p-2 rounded transition-colors ${
            showDebugPanel
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
          title={showDebugPanel ? "Hide Debug panel" : "Show Debug panel"}
        >
          🐛
        </button>
      </div>
    </div>
  );
};

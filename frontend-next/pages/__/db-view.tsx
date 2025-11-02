import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Edit2,
  Save,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface Field {
  id: string;
  name: string;
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: string;
}

interface Table {
  id: string;
  name: string;
  module: string;
  x: number;
  y: number;
  fields: Field[];
}

interface Module {
  id: string;
  name: string;
  description: string;
  tables: string[];
}

interface Data {
  modules: Module[];
  tables: Table[];
}

interface TypeSelector {
  tableId: string;
  fieldId: string;
  x: number;
  y: number;
}

interface FieldUpdates {
  name?: string;
  type?: string;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: string;
}

const ModuleManager = () => {
  const initialData = {
    modules: [
      {
        id: "dashboard",
        name: "Dashboard",
        description: "Main dashboard",
        tables: ["users", "dashboard_widgets"],
      },
      {
        id: "content",
        name: "Content Module",
        description: "Content management",
        tables: [
          "sections",
          "chapters",
          "topics",
          "questions",
          "question_choices",
        ],
      },
      {
        id: "payments",
        name: "Payments Module",
        description: "Payment processing",
        tables: ["payment_methods", "payment_history"],
      },
    ],
    tables: [
      {
        id: "users",
        name: "Users",
        module: "dashboard",
        x: 50,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          { id: "email", name: "Email", type: "string", unique: true },
          { id: "name", name: "Name", type: "string" },
        ],
      },
      {
        id: "dashboard_widgets",
        name: "Dashboard Widgets",
        module: "dashboard",
        x: 350,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "user_id",
            name: "User ID",
            type: "uuid",
            foreignKey: "users.id",
          },
          { id: "title", name: "Title", type: "string" },
        ],
      },
      {
        id: "sections",
        name: "Sections",
        module: "content",
        x: 50,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          { id: "name", name: "Name", type: "string" },
        ],
      },
      {
        id: "chapters",
        name: "Chapters",
        module: "content",
        x: 300,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "section_id",
            name: "Section ID",
            type: "uuid",
            foreignKey: "sections.id",
          },
          { id: "name", name: "Name", type: "string" },
        ],
      },
      {
        id: "topics",
        name: "Topics",
        module: "content",
        x: 550,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "chapter_id",
            name: "Chapter ID",
            type: "uuid",
            foreignKey: "chapters.id",
          },
          { id: "name", name: "Name", type: "string" },
        ],
      },
      {
        id: "questions",
        name: "Questions",
        module: "content",
        x: 50,
        y: 250,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "topic_id",
            name: "Topic ID",
            type: "uuid",
            foreignKey: "topics.id",
          },
          { id: "text", name: "Question Text", type: "text" },
        ],
      },
      {
        id: "question_choices",
        name: "Question Choices",
        module: "content",
        x: 350,
        y: 250,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "question_id",
            name: "Question ID",
            type: "uuid",
            foreignKey: "questions.id",
          },
          { id: "text", name: "Choice Text", type: "text" },
        ],
      },
      {
        id: "payment_methods",
        name: "Payment Methods",
        module: "payments",
        x: 50,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "user_id",
            name: "User ID",
            type: "uuid",
            foreignKey: "users.id",
          },
          { id: "type", name: "Type", type: "string" },
        ],
      },
      {
        id: "payment_history",
        name: "Payment History",
        module: "payments",
        x: 350,
        y: 50,
        fields: [
          { id: "id", name: "ID", type: "uuid", primaryKey: true },
          {
            id: "payment_method_id",
            name: "Method ID",
            type: "uuid",
            foreignKey: "payment_methods.id",
          },
          { id: "amount", name: "Amount", type: "decimal" },
        ],
      },
    ],
  };

  const [data, setData] = useState<Data>(initialData);
  const [selectedModule, setSelectedModule] = useState<string>(
    initialData.modules[0].id
  );
  const [zoom, setZoom] = useState<number>(1);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [typeSelector, setTypeSelector] = useState<TypeSelector | null>(null);
  const [jsonPanelWidth, setJsonPanelWidth] = useState<number>(400);
  const resizeStateRef = useRef<{
    isResizing: boolean;
    startX: number;
    startWidth: number;
  }>({ isResizing: false, startX: 0, startWidth: 400 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentModule = data.modules.find((m) => m.id === selectedModule);
  const moduleTables = data.tables.filter((t) => t.module === selectedModule);

  const findTableById = (id: string): Table | undefined =>
    data.tables.find((t) => t.id === id);
  const getRelatedTables = (table: Table): Table[] => {
    return table.fields
      .filter((f): f is Field & { foreignKey: string } => !!f.foreignKey)
      .map((f) => f.foreignKey.split(".")[0])
      .map((tableId) => findTableById(tableId))
      .filter((t): t is Table => !!t);
  };

  const drawConnections = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    moduleTables.forEach((table) => {
      const related = getRelatedTables(table);
      related.forEach((relTable) => {
        const fromX = (table.x + 160) * zoom;
        const fromY = (table.y + 60) * zoom;
        const toX = relTable.x * zoom;
        const toY = (relTable.y + 60) * zoom;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrow
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowSize = 8;
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - arrowSize * Math.cos(angle - Math.PI / 6),
          toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - arrowSize * Math.cos(angle + Math.PI / 6),
          toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.fill();
      });
    });
  };

  useEffect(() => {
    drawConnections();
  }, [moduleTables, zoom]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!resizeStateRef.current.isResizing) return;

      const deltaX = resizeStateRef.current.startX - e.clientX;
      const newWidth = resizeStateRef.current.startWidth + deltaX;
      setJsonPanelWidth(Math.max(250, Math.min(800, newWidth)));
    };

    const handleGlobalMouseUp = () => {
      resizeStateRef.current.isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return;
    setDraggingTable(tableId);
    const table = findTableById(tableId);
    if (table) {
      setDragOffset({
        x: e.clientX - table.x * zoom,
        y: e.clientY - table.y * zoom,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;

    const newX = (e.clientX - dragOffset.x) / zoom;
    const newY = (e.clientY - dragOffset.y) / zoom;

    setData({
      ...data,
      tables: data.tables.map((t) =>
        t.id === draggingTable
          ? { ...t, x: Math.max(0, newX), y: Math.max(0, newY) }
          : t
      ),
    });
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    resizeStateRef.current = {
      isResizing: true,
      startX: e.clientX,
      startWidth: jsonPanelWidth,
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const addTable = () => {
    const newTableId = `table_${Date.now()}`;
    const newTable = {
      id: newTableId,
      name: "New Table",
      module: selectedModule,
      x: 50 + Math.random() * 300,
      y: 50 + Math.random() * 300,
      fields: [{ id: "id", name: "ID", type: "uuid", primaryKey: true }],
    };
    setData({
      ...data,
      tables: [...data.tables, newTable],
      modules: data.modules.map((m) =>
        m.id === selectedModule
          ? { ...m, tables: [...m.tables, newTableId] }
          : m
      ),
    });
  };

  const deleteTable = (tableId: string) => {
    setData({
      ...data,
      tables: data.tables.filter((t) => t.id !== tableId),
      modules: data.modules.map((m) => ({
        ...m,
        tables: m.tables.filter((t) => t !== tableId),
      })),
    });
  };

  const addColumn = (tableId: string) => {
    setData({
      ...data,
      tables: data.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: [
                ...t.fields,
                {
                  id: `field_${Date.now()}`,
                  name: "New Field",
                  type: "string",
                },
              ],
            }
          : t
      ),
    });
  };

  const deleteColumn = (tableId: string, fieldId: string) => {
    setData({
      ...data,
      tables: data.tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      ),
    });
  };

  const updateField = (
    tableId: string,
    fieldId: string,
    updates: FieldUpdates
  ) => {
    setData({
      ...data,
      tables: data.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: t.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : t
      ),
    });
  };

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
    link.download = "modules-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">
            Module Manager - ERD Canvas
          </h1>

          {/* Module Selector */}
          <div className="flex gap-2 flex-wrap items-center">
            {data.modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                  selectedModule === module.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {module.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex gap-3 items-center">
            <button
              onClick={addTable}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              <Plus size={16} /> Add Table
            </button>
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
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
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
            </div>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 bg-gray-800 relative overflow-hidden cursor-move"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={1400}
              height={800}
              className="absolute top-0 left-0 pointer-events-none"
            />

            {/* Tables */}
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {moduleTables.map((table) => (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table.id)}
                  style={{
                    position: "absolute",
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                    width: "180px",
                    cursor: draggingTable === table.id ? "grabbing" : "grab",
                  }}
                  className="bg-white rounded-lg shadow-xl border-2 border-gray-300 hover:border-blue-500 transition-colors"
                >
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 rounded-t-md">
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <input
                        type="text"
                        value={table.name}
                        onChange={(e) => {
                          e.stopPropagation();
                          setData({
                            ...data,
                            tables: data.tables.map((t) =>
                              t.id === table.id
                                ? { ...t, name: e.target.value }
                                : t
                            ),
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-xs leading-tight bg-transparent outline-none text-white placeholder-gray-200 flex-1 min-w-0 px-1 rounded hover:bg-blue-500 focus:bg-blue-500 truncate"
                        placeholder="Table name"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(table.id);
                        }}
                        className="p-1 hover:bg-red-600 rounded transition-colors opacity-80 hover:opacity-100 flex-shrink-0"
                        title="Delete table"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                    {table.fields.map((field) => (
                      <div
                        key={field.id}
                        className="p-1.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-1 group min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-0.5">
                          <div className="flex items-center gap-1 mb-0.5 min-w-0 flex-1">
                            {field.primaryKey && (
                              <span className="text-yellow-600 font-bold flex-shrink-0">
                                🔑
                              </span>
                            )}
                            {field.foreignKey && (
                              <span className="text-purple-600 font-bold flex-shrink-0">
                                🔗
                              </span>
                            )}
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) =>
                                updateField(table.id, field.id, {
                                  name: e.target.value,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="font-medium text-gray-800 bg-transparent outline-none text-xs px-1 rounded flex-1 min-w-0 hover:bg-gray-200 focus:bg-gray-200 truncate"
                            />
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setTypeSelector({
                                  tableId: table.id,
                                  fieldId: field.id,
                                  x: rect.left,
                                  y: rect.top,
                                });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 rounded hover:bg-blue-50 flex-shrink-0 whitespace-nowrap"
                            >
                              {field.type}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteColumn(table.id, field.id);
                              }}
                              className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-all text-red-600 flex-shrink-0"
                              title="Delete field"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Field Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addColumn(table.id);
                    }}
                    className="w-full text-blue-600 hover:text-blue-700 font-medium text-xs py-1 border-t border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    + Column
                  </button>
                </div>
              ))}
            </div>

            {moduleTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-gray-500">
                  <p className="text-lg mb-4">No tables in this module</p>
                  <button
                    onClick={addTable}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} /> Create First Table
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={handleResizeStart}
          style={{ cursor: "col-resize" }}
        >
          <div className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-transparent group-hover:bg-blue-400/20 transition-colors" />
        </div>

        {/* JSON Panel */}
        <div
          className="bg-gray-950 border-l border-gray-800 overflow-hidden flex flex-col flex-shrink-0"
          style={{ width: `${jsonPanelWidth}px` }}
        >
          <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">JSON Configuration</h3>
          </div>
          <pre className="flex-1 bg-gray-900 text-green-400 p-3 overflow-auto text-xs font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>

      {/* Type Selector Modal */}
      {typeSelector && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-0 z-40"
            onClick={() => setTypeSelector(null)}
          />
          <div
            className="fixed bg-white rounded-lg shadow-2xl z-50 border border-gray-300 overflow-hidden"
            style={{
              left: `${typeSelector.x}px`,
              top: `${typeSelector.y}px`,
              minWidth: "150px",
            }}
          >
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <p className="text-xs font-semibold text-gray-700">Select Type</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {[
                "uuid",
                "string",
                "text",
                "integer",
                "decimal",
                "boolean",
                "timestamp",
                "date",
                "json",
                "enum",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    updateField(typeSelector.tableId, typeSelector.fieldId, {
                      type,
                    });
                    setTypeSelector(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModuleManager;

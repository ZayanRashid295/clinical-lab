import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import {
  ChevronDown,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { MenuItem } from "../../../../types/menu";
import { EditItemForm } from "./EditItemForm";

interface MenuItemCardProps {
  item: MenuItem;
  depth: number;
  isExpanded: boolean;
  isEditing: boolean;
  isDragging: boolean;
  editData: MenuItem;
  draggedItemId: string | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onEditChange: (item: MenuItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  children?: React.ReactNode;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  depth,
  isExpanded,
  isEditing,
  isDragging,
  editData,
  draggedItemId,
  onDragStart,
  onDragEnd,
  onToggleExpand,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onPromote,
  onDemote,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  children,
}) => {
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (isEditing) {
    return (
      <Card className="mb-2 border-yellow-300 bg-yellow-50/50">
        <CardContent className="p-4">
          <EditItemForm
            item={editData}
            onChange={onEditChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${depth > 0 ? "ml-6" : ""}`}>
      <div
        draggable={!isEditing}
        onDragStart={(e) => {
          if (!isEditing) {
            onDragStart();
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.id);
          }
        }}
        onDragEnd={(e) => {
          onDragEnd();
        }}
        onDragOver={(e) => {
          if (draggedItemId && draggedItemId !== item.id && !isEditing) {
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            // Position detection is handled by drop zones, this just allows the drag
          }
        }}
        className={`flex items-center gap-2 p-2 rounded border transition-all select-none ${
          isDragging
            ? "opacity-50 cursor-grabbing"
            : draggedItemId
            ? "cursor-grab"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}
      >
        {hasSubmenu ? (
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
            style={{
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          >
            <ChevronDown size={18} />
          </button>
        ) : (
          <div className="w-6 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {item.label}
              </div>
              <div className="text-xs text-gray-500 truncate">{item.path}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1 ml-6">
            Roles: {item.roles.join(", ")}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onMoveUp}
            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
            title="Move up"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={onMoveDown}
            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
            title="Move down"
          >
            <ArrowDown size={16} />
          </button>
          {depth > 0 && (
            <button
              onClick={onPromote}
              className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
              title="Promote to parent level"
            >
              <ArrowUp size={16} />
            </button>
          )}
          {depth === 0 && (
            <button
              onClick={onDemote}
              className="p-1 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
              title="Demote to submenu"
            >
              <ArrowDown size={16} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1 hover:bg-orange-100 rounded text-orange-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isExpanded && hasSubmenu && children && (
        <div className="mt-1 space-y-1">{children}</div>
      )}
    </div>
  );
};

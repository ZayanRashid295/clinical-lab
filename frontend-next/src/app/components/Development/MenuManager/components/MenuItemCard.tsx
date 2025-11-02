import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  ChevronDown,
  ChevronRight,
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
  editData: MenuItem;
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
  editData,
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
    <Card
      className={`mb-2 transition-all duration-200 hover:shadow-md ${
        depth > 0 ? "ml-6" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasSubmenu ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-8" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.label}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {item.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {item.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveUp}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveDown}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                {depth > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPromote}
                    title="Promote to parent level"
                    className="text-green-600 hover:text-green-700"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
                {depth === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDemote}
                    title="Demote to submenu"
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  title="Delete"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {item.roles.join(", ")}
              </Badge>
              {hasSubmenu && (
                <Badge variant="outline" className="text-xs">
                  {item.submenu?.length} submenu items
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isExpanded && hasSubmenu && children && (
          <div className="mt-4 pt-4 border-t">{children}</div>
        )}
      </CardContent>
    </Card>
  );
};

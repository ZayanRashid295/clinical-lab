import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Menu } from "lucide-react";
import { MenuItem } from "../../../../types/menu";
import { MenuItemCard } from "./MenuItemCard";

interface MenuItemListProps {
  items: MenuItem[];
  expandedItems: Set<string>;
  editingId: string | null;
  editData: MenuItem;
  onToggleExpand: (id: string) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
  onEditChange: (item: MenuItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const MenuItemList: React.FC<MenuItemListProps> = ({
  items,
  expandedItems,
  editingId,
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
}) => {
  const renderMenuItem = (item: MenuItem, depth = 0): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    const isEditing = editingId === item.id;

    return (
      <MenuItemCard
        key={item.id}
        item={item}
        depth={depth}
        isExpanded={isExpanded}
        isEditing={isEditing}
        editData={editData}
        onToggleExpand={() => onToggleExpand(item.id)}
        onEdit={() => onEdit(item)}
        onDelete={() => onDelete(item.id)}
        onMoveUp={() => onMoveUp(item.id)}
        onMoveDown={() => onMoveDown(item.id)}
        onPromote={() => onPromote(item.id)}
        onDemote={() => onDemote(item.id)}
        onEditChange={onEditChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      >
        {isExpanded &&
          item.submenu &&
          item.submenu.length > 0 &&
          item.submenu.map((subItem) => renderMenuItem(subItem, depth + 1))}
      </MenuItemCard>
    );
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Menu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No menu items found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms to find menu items.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Menu Items ({items.length})</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Menu className="h-4 w-4" />
          {items.length} total items
        </div>
      </div>
      <div>{items.map((item) => renderMenuItem(item))}</div>
    </div>
  );
};

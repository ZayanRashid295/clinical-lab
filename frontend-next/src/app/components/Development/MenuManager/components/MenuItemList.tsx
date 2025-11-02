import React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Menu, ArrowUp, ArrowDown } from "lucide-react";
import { MenuItem } from "../../../../types/menu";
import { MenuItemCard } from "./MenuItemCard";

interface MenuItemListProps {
  items: MenuItem[];
  expandedItems: Set<string>;
  editingId: string | null;
  editData: MenuItem;
  draggedItemId: string | null;
  dragOverPosition: { targetId: string; position: "before" | "after" } | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (targetId: string, position: "before" | "after") => void;
  onDrop: (
    draggedId: string,
    targetId: string,
    position: "before" | "after"
  ) => void;
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
  draggedItemId,
  dragOverPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
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
  // Helper function to find an item by ID recursively
  const findItemById = (arr: MenuItem[], id: string): MenuItem | null => {
    for (const item of arr) {
      if (item.id === id) {
        return item;
      }
      if (item.submenu) {
        const found = findItemById(item.submenu, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Get the dragged item if it exists
  const draggedItem = draggedItemId ? findItemById(items, draggedItemId) : null;

  // State to track items that should be hidden (after drag image is captured)
  const [hiddenItems, setHiddenItems] = React.useState<Set<string>>(new Set());

  // State to track selected item
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  );

  // Helper to check if item can move up/down
  const canMoveUp = React.useMemo(() => {
    if (!selectedItemId) return false;
    const findItemPosition = (
      arr: MenuItem[],
      targetId: string,
      path: number[] = []
    ): number[] | null => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === targetId) {
          return [...path, i];
        }
        if (arr[i].submenu) {
          const found = findItemPosition(arr[i].submenu!, targetId, [
            ...path,
            i,
          ]);
          if (found) return found;
        }
      }
      return null;
    };
    const position = findItemPosition(items, selectedItemId);
    if (!position || position.length === 0) return false;
    return position[position.length - 1] > 0;
  }, [selectedItemId, items]);

  const canMoveDown = React.useMemo(() => {
    if (!selectedItemId) return false;
    const findItemPosition = (
      arr: MenuItem[],
      targetId: string,
      path: number[] = []
    ): number[] | null => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === targetId) {
          return [...path, i];
        }
        if (arr[i].submenu) {
          const found = findItemPosition(arr[i].submenu!, targetId, [
            ...path,
            i,
          ]);
          if (found) return found;
        }
      }
      return null;
    };
    const findParentArray = (arr: MenuItem[], path: number[]): MenuItem[] => {
      if (path.length === 1) return arr;
      let current: MenuItem[] = arr;
      for (let i = 0; i < path.length - 1; i++) {
        const idx = path[i];
        if (current[idx]?.submenu) {
          current = current[idx].submenu!;
        }
      }
      return current;
    };
    const position = findItemPosition(items, selectedItemId);
    if (!position || position.length === 0) return false;
    const parentArray = findParentArray(items, position);
    return position[position.length - 1] < parentArray.length - 1;
  }, [selectedItemId, items]);

  // Hide item after drag image is captured
  React.useEffect(() => {
    if (draggedItemId) {
      // Use requestAnimationFrame to delay hiding until after drag image is captured
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHiddenItems(new Set([draggedItemId]));
        });
      });
      return () => {
        cancelAnimationFrame(timer);
      };
    } else {
      setHiddenItems(new Set());
    }
  }, [draggedItemId]);

  const renderMenuItem = (
    item: MenuItem,
    depth = 0,
    index: number = 0,
    siblings: MenuItem[] = []
  ): React.ReactNode => {
    const isExpanded = expandedItems.has(item.id);
    const isEditing = editingId === item.id;
    const isDragging = draggedItemId === item.id;
    const shouldHide = hiddenItems.has(item.id);
    const isSelected = selectedItemId === item.id;
    const showDropZoneBefore =
      dragOverPosition?.targetId === item.id &&
      dragOverPosition.position === "before";
    const showDropZoneAfter =
      dragOverPosition?.targetId === item.id &&
      dragOverPosition.position === "after";

    return (
      <React.Fragment key={item.id}>
        {/* Drop zone before item */}
        {showDropZoneBefore && draggedItem ? (
          <div
            className="opacity-60 border-2 border-blue-600 border-dashed rounded -my-1 z-10 pointer-events-auto"
            onDragOver={(e) => {
              if (draggedItemId && draggedItemId !== item.id) {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y < rect.height / 2) {
                  onDragOver(item.id, "before");
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedItemId && draggedItemId !== item.id) {
                onDrop(draggedItemId, item.id, "before");
                onDragEnd();
              }
            }}
          >
            <div className="pointer-events-none">
              <MenuItemCard
                item={draggedItem}
                depth={depth}
                isExpanded={false}
                isEditing={false}
                isDragging={false}
                editData={editData}
                draggedItemId={draggedItemId}
                dragOverPosition={dragOverPosition}
                onDragStart={() => {}}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onToggleExpand={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onPromote={() => {}}
                onDemote={() => {}}
                onEditChange={onEditChange}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            </div>
          </div>
        ) : (
          <div
            className={`transition-all ${
              draggedItemId && draggedItemId !== item.id
                ? "h-2 hover:h-6 hover:bg-blue-100 hover:-my-1"
                : "h-1"
            }`}
            onDragOver={(e) => {
              if (draggedItemId && draggedItemId !== item.id) {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y < rect.height / 2) {
                  onDragOver(item.id, "before");
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedItemId && draggedItemId !== item.id) {
                onDrop(draggedItemId, item.id, "before");
                onDragEnd();
              }
            }}
          />
        )}

        {/* Hide the item visually when dragging but keep it rendered for drag image */}
        <div style={{ display: shouldHide ? "none" : "block" }}>
          <MenuItemCard
            item={item}
            depth={depth}
            isExpanded={isExpanded}
            isEditing={isEditing}
            isDragging={isDragging}
            isSelected={isSelected}
            editData={editData}
            draggedItemId={draggedItemId}
            dragOverPosition={dragOverPosition}
            onDragStart={() => onDragStart(item.id)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onToggleExpand={() => onToggleExpand(item.id)}
            onSelect={() => setSelectedItemId(item.id)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
            onPromote={() => onPromote(item.id)}
            onDemote={() => onDemote(item.id)}
            onEditChange={onEditChange}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
          >
            {isExpanded && item.submenu && item.submenu.length > 0 && (
              <>
                {item.submenu.map((subItem, subIndex) =>
                  renderMenuItem(
                    subItem,
                    depth + 1,
                    subIndex,
                    item.submenu || []
                  )
                )}
              </>
            )}
          </MenuItemCard>
        </div>

        {/* Drop zone after item */}
        {showDropZoneAfter && draggedItem ? (
          <div
            className="opacity-60 border-2 border-blue-600 border-dashed rounded -my-1 z-10 pointer-events-auto"
            onDragOver={(e) => {
              if (draggedItemId && draggedItemId !== item.id) {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y > rect.height / 2) {
                  onDragOver(item.id, "after");
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedItemId && draggedItemId !== item.id) {
                onDrop(draggedItemId, item.id, "after");
                onDragEnd();
              }
            }}
          >
            <div className="pointer-events-none">
              <MenuItemCard
                item={draggedItem}
                depth={depth}
                isExpanded={false}
                isEditing={false}
                isDragging={false}
                editData={editData}
                draggedItemId={draggedItemId}
                dragOverPosition={dragOverPosition}
                onDragStart={() => {}}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onToggleExpand={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onPromote={() => {}}
                onDemote={() => {}}
                onEditChange={onEditChange}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
              />
            </div>
          </div>
        ) : (
          <div
            className={`transition-all ${
              draggedItemId && draggedItemId !== item.id
                ? "h-2 hover:h-6 hover:bg-blue-100 hover:-my-1"
                : "h-1"
            }`}
            onDragOver={(e) => {
              if (draggedItemId && draggedItemId !== item.id) {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y > rect.height / 2) {
                  onDragOver(item.id, "after");
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedItemId && draggedItemId !== item.id) {
                onDrop(draggedItemId, item.id, "after");
                onDragEnd();
              }
            }}
          />
        )}
      </React.Fragment>
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
    <div className="mb-6">
      {/* Move controls */}
      <div className="mb-3 flex items-center gap-2 px-2">
        <span className="text-sm text-gray-600">Move:</span>
        <button
          onClick={() => {
            if (selectedItemId) {
              onMoveUp(selectedItemId);
            }
          }}
          disabled={!selectedItemId || !canMoveUp}
          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Move selected item up"
        >
          <ArrowUp size={18} />
        </button>
        <button
          onClick={() => {
            if (selectedItemId) {
              onMoveDown(selectedItemId);
            }
          }}
          disabled={!selectedItemId || !canMoveDown}
          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title="Move selected item down"
        >
          <ArrowDown size={18} />
        </button>
        {selectedItemId && (
          <span className="text-sm text-gray-500 ml-2">
            Selected: {findItemById(items, selectedItemId)?.label}
          </span>
        )}
      </div>

      {/* Menu items tree */}
      <div className="border border-gray-200 rounded-lg p-4 max-h-screen overflow-y-auto bg-gray-50">
        <div>
          {items.map((item, index) => renderMenuItem(item, 0, index, items))}
        </div>
      </div>
    </div>
  );
};

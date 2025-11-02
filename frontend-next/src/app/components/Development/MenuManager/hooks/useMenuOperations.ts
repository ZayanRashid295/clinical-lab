import { useState } from "react";
import { MenuItem } from "../../../../types/menu";

export const useMenuOperations = (initialItems: MenuItem[]) => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<MenuItem>({} as MenuItem);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{
    targetId: string;
    position: "before" | "after";
  } | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const saveEdit = () => {
    const updateItem = (arr: MenuItem[]): MenuItem[] => {
      return arr.map((item: MenuItem) => {
        if (item.id === editingId) {
          return { ...editData };
        }
        if (item.submenu) {
          return { ...item, submenu: updateItem(item.submenu) };
        }
        return item;
      });
    };
    setItems(updateItem(items));
    setEditingId(null);
    setEditData({} as MenuItem);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({} as MenuItem);
  };

  const deleteItem = (id: string) => {
    const deleteFromArray = (arr: MenuItem[]): MenuItem[] => {
      return arr.filter((item: MenuItem) => {
        if (item.id === id) return false;
        if (item.submenu) {
          item.submenu = deleteFromArray(item.submenu);
        }
        return true;
      });
    };
    setItems(deleteFromArray(items));
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const moveInArray = (
      arr: MenuItem[],
      targetId: string,
      dir: "up" | "down"
    ): boolean => {
      const index = arr.findIndex((item: MenuItem) => item.id === targetId);
      if (index === -1) {
        for (let item of arr) {
          if (item.submenu) {
            const result = moveInArray(item.submenu, targetId, dir);
            if (result) return true;
          }
        }
        return false;
      }

      if (dir === "up" && index > 0) {
        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
        return true;
      } else if (dir === "down" && index < arr.length - 1) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return true;
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    moveInArray(newItems, id, direction);
    setItems(newItems);
  };

  const promoteItem = (id: string) => {
    const promoteInArray = (
      arr: MenuItem[],
      targetId: string,
      depth = 0
    ): boolean => {
      for (let i = 0; i < arr.length; i++) {
        const submenu = arr[i].submenu;
        if (submenu && submenu.length > 0) {
          const subIndex = submenu.findIndex(
            (item: MenuItem) => item.id === targetId
          );
          if (subIndex !== -1) {
            const item = submenu[subIndex];
            submenu.splice(subIndex, 1);
            arr.splice(i + 1, 0, item);
            return true;
          }
          if (promoteInArray(submenu, targetId, depth + 1)) {
            return true;
          }
        }
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    promoteInArray(newItems, id);
    setItems(newItems);
  };

  const demoteItem = (id: string) => {
    const demoteInArray = (arr: MenuItem[], targetId: string): boolean => {
      const index = arr.findIndex((item: MenuItem) => item.id === targetId);
      if (index === -1) {
        for (let item of arr) {
          if (item.submenu) {
            if (demoteInArray(item.submenu, targetId)) return true;
          }
        }
        return false;
      }

      if (index > 0) {
        const parentItem = arr[index - 1];
        if (!parentItem.submenu) {
          parentItem.submenu = [];
        }
        const item = arr.splice(index, 1)[0];
        parentItem.submenu.push(item);
        return true;
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    demoteInArray(newItems, id);
    setItems(newItems);
  };

  const findItemPath = (
    arr: MenuItem[],
    targetId: string,
    path: Array<{ array: MenuItem[]; index: number }> = []
  ): Array<{ array: MenuItem[]; index: number }> | null => {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === targetId) {
        return [...path, { array: arr, index: i }];
      }
      if (arr[i].submenu) {
        const found = findItemPath(arr[i].submenu!, targetId, [
          ...path,
          { array: arr, index: i },
        ]);
        if (found) return found;
      }
    }
    return null;
  };

  const dragReorderItem = (
    draggedId: string,
    targetId: string,
    position: "before" | "after"
  ) => {
    if (draggedId === targetId) return;

    // Deep clone the entire structure
    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];

    // Find paths to both items
    const draggedPath = findItemPath(newItems, draggedId);
    const targetPath = findItemPath(newItems, targetId);

    if (!draggedPath || !targetPath) {
      console.error("Could not find dragged or target item");
      return;
    }

    // Get the dragged item (deep clone)
    const draggedPathLast = draggedPath[draggedPath.length - 1];
    const draggedItem = JSON.parse(
      JSON.stringify(draggedPathLast.array[draggedPathLast.index])
    ) as MenuItem;

    // Get source and target arrays and indices
    const sourceArray = draggedPathLast.array;
    const targetArray = targetPath[targetPath.length - 1].array;
    const draggedIndex = draggedPathLast.index;
    let targetIndex = targetPath[targetPath.length - 1].index;

    // Check if moving within the same array
    const sameArray = sourceArray === targetArray;

    if (sameArray) {
      // Same array - remove first, then adjust target index
      sourceArray.splice(draggedIndex, 1);

      // Adjust target index if we removed an item before it
      if (draggedIndex < targetIndex) {
        targetIndex -= 1;
      }

      // Adjust based on position
      if (position === "after") {
        targetIndex += 1;
      } else {
        // position === "before", targetIndex is already correct
      }

      // Insert at target position
      targetArray.splice(targetIndex, 0, draggedItem);
    } else {
      // Different arrays - remove from source first
      sourceArray.splice(draggedIndex, 1);

      // Adjust target index based on position
      if (position === "after") {
        targetIndex += 1;
      }

      // Insert at target position
      targetArray.splice(targetIndex, 0, draggedItem);
    }

    // Create a completely new array structure to ensure React detects the change
    const createNewArrayStructure = (arr: MenuItem[]): MenuItem[] => {
      return arr.map((item) => {
        const newItem = { ...item };
        if (item.submenu && item.submenu.length > 0) {
          newItem.submenu = createNewArrayStructure(item.submenu);
        }
        return newItem;
      });
    };

    // Force React to see this as a completely new structure
    const updatedItems = createNewArrayStructure(newItems);
    setItems(updatedItems);
  };

  return {
    items,
    setItems,
    expandedItems,
    editingId,
    editData,
    setEditData,
    draggedItemId,
    dragOverPosition,
    setDraggedItemId,
    setDragOverPosition,
    toggleExpand,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    moveItem,
    promoteItem,
    demoteItem,
    dragReorderItem,
  };
};


import { useState } from "react";
import { MenuItem } from "../../../../types/menu";

export const useMenuOperations = (initialItems: MenuItem[]) => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<MenuItem>({} as MenuItem);

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

  return {
    items,
    setItems,
    expandedItems,
    editingId,
    editData,
    setEditData,
    toggleExpand,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    moveItem,
    promoteItem,
    demoteItem,
  };
};


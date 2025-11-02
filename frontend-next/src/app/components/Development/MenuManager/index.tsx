"use client";

import React, { useState, useMemo } from "react";
import { MenuItem } from "../../../types/menu";
import { MENU_CONFIG } from "../../../config/menu.config";
import { useMenuOperations } from "./hooks/useMenuOperations";
import { MenuHeader } from "./components/MenuHeader";
import { MenuSearchBar } from "./components/MenuSearchBar";
import { ControlsInfo } from "./components/ControlsInfo";
import { MenuItemList } from "./components/MenuItemList";
import { JSONOutput } from "./components/JSONOutput";
import { filterMenuItems } from "./utils/menuFilters";

const MenuManager = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    items,
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
  } = useMenuOperations(MENU_CONFIG.items);

  const filteredItems = useMemo(
    () => filterMenuItems(items, searchTerm),
    [items, searchTerm]
  );

  const downloadJSON = () => {
    const dataStr = JSON.stringify({ items }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ items }, null, 2));
    alert("Menu configuration copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <MenuHeader onCopyJSON={copyJSON} onDownloadJSON={downloadJSON} />
      <MenuSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <ControlsInfo />
      <MenuItemList
        items={filteredItems}
        expandedItems={expandedItems}
        editingId={editingId}
        editData={editData}
        onToggleExpand={toggleExpand}
        onEdit={startEdit}
        onDelete={deleteItem}
        onMoveUp={(id) => moveItem(id, "up")}
        onMoveDown={(id) => moveItem(id, "down")}
        onPromote={promoteItem}
        onDemote={demoteItem}
        onEditChange={setEditData}
        onSaveEdit={saveEdit}
        onCancelEdit={cancelEdit}
      />
      <JSONOutput items={items} />
    </div>
  );
};

export default MenuManager;


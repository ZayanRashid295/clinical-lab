"use client";

import React from "react";
import { MENU_CONFIG } from "../../../config/menu.config";
import { useMenuOperations } from "./hooks/useMenuOperations";
import { MenuHeader } from "./components/MenuHeader";
import { ControlsInfo } from "./components/ControlsInfo";
import { MenuItemList } from "./components/MenuItemList";
import { JSONOutput } from "./components/JSONOutput";

const MenuManager = () => {
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
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <MenuHeader />
      <ControlsInfo />
      <MenuItemList
        items={items}
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
      <div className="flex gap-3 mb-6">
        <button
          onClick={copyJSON}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Copy JSON
        </button>
        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Download JSON
        </button>
      </div>
      <JSONOutput items={items} />
    </div>
  );
};

export default MenuManager;

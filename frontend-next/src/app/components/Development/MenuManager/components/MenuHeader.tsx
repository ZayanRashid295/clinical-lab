import React from "react";

interface MenuHeaderProps {}

export const MenuHeader: React.FC<MenuHeaderProps> = () => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Manager</h1>
      <p className="text-sm text-gray-600">
        Manage your menu system with drag-drop, edit, delete, and
        promote/demote functionality
      </p>
    </div>
  );
};

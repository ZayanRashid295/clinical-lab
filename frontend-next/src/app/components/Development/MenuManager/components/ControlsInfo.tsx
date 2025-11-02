import React from "react";
import { Card, CardContent } from "@/shared/ui/card";

export const ControlsInfo: React.FC = () => {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-3">Controls:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold">↑/↓</span> Move within level
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 px-2 py-1 rounded font-semibold">
              ↑
            </span>{" "}
            Promote item
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-yellow-100 px-2 py-1 rounded font-semibold">
              ↓
            </span>{" "}
            Demote item
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">✏️</span> Edit details
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🗑️</span> Delete item
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🖱️</span> Drag & drop
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


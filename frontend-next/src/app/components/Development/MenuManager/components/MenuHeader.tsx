import React from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface MenuHeaderProps {
  onCopyJSON: () => void;
  onDownloadJSON: () => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({
  onCopyJSON,
  onDownloadJSON,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Menu Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your menu system with drag-drop, edit, delete, and
          promote/demote functionality
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onCopyJSON}>
          <Copy className="h-4 w-4 mr-2" />
          Copy JSON
        </Button>
        <Button onClick={onDownloadJSON}>
          <Download className="h-4 w-4 mr-2" />
          Download JSON
        </Button>
      </div>
    </div>
  );
};

import React from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Save, X } from "lucide-react";
import { MenuItem } from "../../../../types/menu";

interface EditItemFormProps {
  item: MenuItem;
  onChange: (item: MenuItem) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditItemForm: React.FC<EditItemFormProps> = ({
  item,
  onChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            type="text"
            value={item.label}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Icon</Label>
          <Input
            type="text"
            value={item.icon}
            onChange={(e) => onChange({ ...item, icon: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Path</Label>
          <Input
            type="text"
            value={item.path}
            onChange={(e) => onChange({ ...item, path: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>ID</Label>
          <Input
            type="text"
            value={item.id}
            onChange={(e) => onChange({ ...item, id: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Roles (comma-separated)</Label>
          <Input
            type="text"
            value={item.roles.join(", ")}
            onChange={(e) =>
              onChange({
                ...item,
                roles: e.target.value
                  .split(",")
                  .map((r) => r.trim())
                  .filter((r) => r),
              })
            }
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};

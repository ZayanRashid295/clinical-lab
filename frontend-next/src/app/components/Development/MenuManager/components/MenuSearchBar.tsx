import React, { useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Search, Filter, Plus } from "lucide-react";

interface MenuSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const MenuSearchBar: React.FC<MenuSearchBarProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Menu Item
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Info</Label>
                <div className="text-sm text-muted-foreground">
                  Use search to filter by label, path, or ID
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

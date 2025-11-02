import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { MenuItem } from "../../../../types/menu";

interface JSONOutputProps {
  items: MenuItem[];
}

export const JSONOutput: React.FC<JSONOutputProps> = ({ items }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">JSON Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-64 text-foreground font-mono">
          {JSON.stringify({ items }, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

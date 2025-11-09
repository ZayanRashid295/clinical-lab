"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../src/shared/ui/card";
import { Button } from "../../../src/shared/ui/button";
import { Badge } from "../../../src/shared/ui/badge";
import { FileText, Plus, Search, Filter } from "lucide-react";

export default function TestTemplatesPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Test Templates
            </h1>
            <p className="text-muted-foreground mt-2">
              Pre-built test templates for quick test creation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search Templates
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Test Templates Coming Soon
            </h2>
            <p className="text-muted-foreground mb-6">
              This feature is under development. You&apos;ll be able to create and
              manage test templates here.
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline">USMLE Step 1</Badge>
              <Badge variant="outline">USMLE Step 2</Badge>
              <Badge variant="outline">MCAT</Badge>
              <Badge variant="outline">Custom</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RotateCcw } from "lucide-react";

export default function TestSettingsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Test Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure global test creation and management settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Test Settings Coming Soon
            </h2>
            <p className="text-muted-foreground mb-6">
              This feature is under development. You'll be able to configure
              test settings here.
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline">Default Time Limits</Badge>
              <Badge variant="outline">Scoring Methods</Badge>
              <Badge variant="outline">Question Types</Badge>
              <Badge variant="outline">Access Controls</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

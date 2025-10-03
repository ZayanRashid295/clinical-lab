"use client";

import React from "react";
import DashboardContent from "@/shared/components/dashboard/dashboard-content";
import RidesContent from "@/shared/components/rides/rides-content";
import MedAppContent from "@/shared/components/med-app/med-app-content";
import ShadowModeContent from "@/shared/components/shadow-mode/shadow-mode-content";

interface ContentSwitcherProps {
  activeMenu: string;
}

export default function ContentSwitcher({ activeMenu }: ContentSwitcherProps) {
  switch (activeMenu) {
    case "dashboard":
      return <DashboardContent isFullScreen={false} />;
    case "rides":
      return <RidesContent isFullScreen={false} />;
    case "med-app":
      return <MedAppContent isFullScreen={false} />;
    case "shadow-mode":
      return <ShadowModeContent isFullScreen={false} />;
    case "fleet":
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">
            Fleet Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Fleet management content coming soon...
          </p>
        </div>
      );
    case "analytics":
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analytics content coming soon...
          </p>
        </div>
      );
    case "payments":
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-2">
            Payments content coming soon...
          </p>
        </div>
      );
    case "zoom-simulation":
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">
            Zoom Simulation
          </h1>
          <p className="text-muted-foreground mt-2">
            Zoom simulation content coming soon...
          </p>
        </div>
      );
    case "admin":
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Admin panel content coming soon...
          </p>
        </div>
      );
    default:
      return <DashboardContent isFullScreen={false} />;
  }
}

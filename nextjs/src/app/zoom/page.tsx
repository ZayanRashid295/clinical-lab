"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import UnderConstruction from "@/shared/components/placeholders/under-construction";

export default function ZoomPage() {
  return (
    <DashboardLayout activeMenuId="zoom-simulation">
      <UnderConstruction
        menuTitle="Zoom Simulation"
        menuIcon="📹"
        description="Interactive video simulation system for training and communication scenarios."
        estimatedCompletion="3 weeks"
        features={[
          "Video call simulation",
          "Interactive training scenarios",
          "Real-time communication tools",
          "Recording and playback capabilities",
          "Multi-participant support",
          "Screen sharing and collaboration",
        ]}
        isFullScreen={false}
      />
    </DashboardLayout>
  );
}
